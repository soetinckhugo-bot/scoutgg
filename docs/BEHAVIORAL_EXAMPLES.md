# Behavioral Guidelines — Exemples concrets

> Exemples réels illustrant les 4 principes du `AGENTS.md`. Chaque exemple montre ce que les LLM font couramment de mal, et comment le corriger.
>
> Ces exemples utilisent la stack ScoutGG (TypeScript, Next.js, Prisma, React) pour maximiser la pertinence.

---

## 1. Think Before Coding

### Exemple 1 : Hypothèses cachées

**Demande :** *"Ajoute une fonction pour exporter les données joueurs"*

#### ❌ Ce que les LLM font (mauvaises hypothèses)

```ts
export async function exportPlayers(format: 'json' | 'csv' = 'json') {
  const players = await prisma.player.findMany();

  if (format === 'json') {
    await fs.writeFile('players.json', JSON.stringify(players));
  } else {
    const csv = players.map(p => `${p.id},${p.pseudo},${p.role}`).join('\n');
    await fs.writeFile('players.csv', csv);
  }

  return `Exported ${players.length} players`;
}
```

**Problèmes :**
- Exporte TOUS les joueurs sans pagination ni filtre (quid du RGPD / données sensibles ?)
- Emplacement du fichier arbitraire (`players.json` à la racine)
- Champs choisis sans validation (pourquoi `id`, `pseudo`, `role` et pas le reste ?)
- Pas de gestion d'erreur ni de streaming (risque OOM avec 10k+ joueurs)

#### ✅ Ce qu'il faut faire (Surface les hypothèses)

Avant d'implémenter, je dois clarifier :

1. **Scope** : Tous les joueurs ou un sous-ensemble filtré ? (implications privacy / RGPD)
2. **Format** : Tu parles d'export, mais tu veux :
   - Un téléchargement de fichier côté client ?
   - Un job background avec notification email ?
   - Un endpoint API qui retourne les données ?
3. **Champs** : Quels champs inclure ? Certains sont sensibles (email, notes internes).
4. **Volume** : Combien de joueurs en base ? (affecte l'approche : streaming vs buffer)

**Approche la plus simple** : Un endpoint API qui retourne du JSON paginé, streamé si volume important.

Besoin de plus d'infos pour un export fichier.

---

### Exemple 2 : Interprétations multiples

**Demande :** *"Rends la recherche de joueurs plus rapide"*

#### ❌ Ce que les LLM font (Choisissent silencieusement)

```ts
// Ajoute du caching Redis, des index DB, du async/await partout
// sans demander ce qui compte comme "plus rapide"
export const searchPlayers = unstable_cache(
  async (query: string) => {
    // ... 200 lignes d'optimisation
  },
  ['search'],
  { revalidate: 3600 }
);
```

#### ✅ Ce qu'il faut faire

"Rendre la recherche plus rapide" peut vouloir dire :

1. **Temps de réponse** (< 100ms au lieu de 500ms)
   - Ajouter des index DB sur `pseudo`, `role`, `league`
   - Utiliser `unstable_cache` avec revalidation adaptée
   - Effort estimé : 2h

2. **Débit** (plus de requêtes concurrentes)
   - Connection pooling Prisma
   - Streaming des résultats
   - Effort estimé : 4h

3. **Vitesse perçue** (UX)
   - Résultats partiels immédiats (debounced input)
   - Skeleton loading
   - Effort estimé : 3h

La recherche actuelle prend ~400ms sur la grille `/players`.
Quel aspect est prioritaire pour ton use case ?

---

## 2. Simplicity First

### Exemple 1 : Sur-abstraction

**Demande :** *"Ajoute une fonction pour calculer le score prospect d'un joueur"*

#### ❌ Ce que les LLM font (Overengineered)

```ts
interface ScoringStrategy {
  calculate(metrics: ProspectMetrics): number;
}

class PercentileScoring implements ScoringStrategy {
  calculate(metrics: ProspectMetrics): number {
    // ...
  }
}

class WeightedScoring implements ScoringStrategy {
  private weights: Record<string, number>;
  constructor(weights: Record<string, number>) {
    this.weights = weights;
  }
  calculate(metrics: ProspectMetrics): number {
    // ...
  }
}

class ProspectScoreCalculator {
  constructor(private strategy: ScoringStrategy) {}

  compute(metrics: ProspectMetrics, config: { minGames: number }): number {
    if (metrics.gamesPlayed < config.minGames) return 0;
    return this.strategy.calculate(metrics);
  }
}

// Usage : 30+ lignes de setup pour un calcul simple
```

#### ✅ Ce qu'il faut faire (Simple)

```ts
function calculateProspectScore(metrics: ProspectMetrics): number {
  if (metrics.gamesPlayed < 5) return 0;

  const score =
    metrics.kda * 0.25 +
    metrics.cspm * 0.20 +
    metrics.visionScore * 0.15 +
    metrics.gdAt15 * 0.40;

  return Math.min(100, Math.max(0, score));
}

// Usage
const score = calculateProspectScore(playerMetrics); // 1 ligne
```

**Quand ajouter de la complexité :** Seulement quand on a besoin de plusieurs stratégies de scoring. Si ce besoin arrive plus tard, on refactorise à ce moment-là.

---

### Exemple 2 : Fonctionnalités spéculatives

**Demande :** *"Sauvegarde les préférences utilisateur en base"*

#### ❌ Ce que les LLM font (Features non demandées)

```ts
class PreferenceManager {
  constructor(
    private db: PrismaClient,
    private cache?: Cache,
    private validator?: Validator
  ) {
    this.cache = cache || new InMemoryCache();
    this.validator = validator || new DefaultValidator();
  }

  async save(
    userId: string,
    prefs: Record<string, unknown>,
    options: { merge?: boolean; validate?: boolean; notify?: boolean } = {}
  ) {
    const { merge = true, validate = true, notify = false } = options;

    if (validate) {
      const errors = this.validator.validate(prefs);
      if (errors.length) throw new ValidationError(errors);
    }

    const existing = merge ? await this.get(userId) : {};
    const merged = merge ? { ...existing, ...prefs } : prefs;

    await this.db.user.update({
      where: { id: userId },
      data: { preferences: merged },
    });

    if (this.cache) this.cache.set(`prefs:${userId}`, merged);
    if (notify) await this.notifyChange(userId, merged);

    return true;
  }

  private async notifyChange(userId: string, prefs: unknown) {
    // 30 lignes pour une feature que personne n'a demandée
  }
}
```

#### ✅ Ce qu'il faut faire (Juste ce qui est demandé)

```ts
async function savePreferences(
  db: PrismaClient,
  userId: string,
  preferences: Record<string, unknown>
) {
  await db.user.update({
    where: { id: userId },
    data: { preferences },
  });
}
```

**À ajouter plus tard si besoin :**
- Cache (quand perf impacte)
- Validation (quand données corrompues apparaissent)
- Merge (quand le besoin émerge)

---

## 3. Surgical Changes

### Exemple 1 : Refactoring en passant

**Demande :** *"Fixe le bug où un email vide fait crasher le validateur de login"*

#### ❌ Ce que les LLM font (Trop de changements)

```diff
  function validateLogin(data: LoginInput) {
-   if (!data.email) {
+   /** Validate login input */
+   const email = data.email?.trim() ?? '';
+
+   if (!email) {
      throw new Error('Email required');
    }
-   if (!data.email.includes('@')) {
+   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email');
    }

-   if (!data.password) {
+   const password = data.password?.trim() ?? '';
+   if (!password || password.length < 8) {
      throw new Error('Password required');
    }
+   if (!/[A-Z]/.test(password)) {
+     throw new Error('Password must contain uppercase');
+   }

    return true;
  }
```

**Problèmes :**
- Améliore la validation email au-delà du bug
- Ajoute des règles de mot de passe non demandées
- Change le style (`?.trim() ?? ''` au lieu de la logique existante)
- Ajoute un commentaire JSDoc

#### ✅ Ce qu'il faut faire (Chirurgical)

```diff
  function validateLogin(data: LoginInput) {
-   if (!data.email) {
+   if (!data.email || !data.email.trim()) {
      throw new Error('Email required');
    }
    if (!data.email.includes('@')) {
      throw new Error('Invalid email');
    }

    if (!data.password) {
      throw new Error('Password required');
    }

    return true;
  }
```

**Seul changement :** La gestion spécifique de l'email vide (avec `trim()`).

---

### Exemple 2 : Dérive de style

**Demande :** *"Ajoute du logging à la fonction d'upload d'image"*

#### ❌ Ce que les LLM font (Reformatent tout)

```diff
- function uploadImage(file: File, path: string) {
+ async function uploadImage(file: File, path: string): Promise<string> {
+   logger.info(`Uploading image to ${path}`);
+
    try {
-     const buffer = await file.arrayBuffer();
-     await writeFile(`public/uploads/${path}`, Buffer.from(buffer));
+     const buffer = Buffer.from(await file.arrayBuffer());
+     const dest = join('public/uploads', path);
+     await writeFile(dest, buffer);
+
+     logger.info(`Upload successful: ${path}`);
-     return path;
+     return dest;
    } catch (err) {
-     console.error('Upload failed', err);
+     logger.error(`Upload failed for ${path}`, err);
      throw err;
    }
  }
```

**Problèmes :**
- Change la signature (ajoute `async` + type retour)
- Change la logique de retour (`path` → `dest`)
- Reformate la structure du code
- Change le style d'imports

#### ✅ Ce qu'il faut faire (Matcher le style existant)

```diff
+ import { logger } from '@/lib/logger';
+
  function uploadImage(file: File, path: string) {
+   logger.info(`Starting upload: ${path}`);
    try {
      const buffer = await file.arrayBuffer();
      await writeFile(`public/uploads/${path}`, Buffer.from(buffer));
+     logger.info(`Upload successful: ${path}`);
      return path;
    } catch (err) {
-     console.error('Upload failed', err);
+     logger.error(`Upload failed: ${path}`, err);
      throw err;
    }
  }
```

**A conservé :** Fonction synchrone (pas `async`), retour `path`, style d'imports existant.

---

## 4. Goal-Driven Execution

### Exemple 1 : Vague vs Vérifiable

**Demande :** *"Fixe le système d'authentification"*

#### ❌ Ce que les LLM font (Approche vague)

> Je vais fixer le système d'authentification en :
> 1. Révisant le code
> 2. Identifiant les problèmes
> 3. Faisant des améliorations
> 4. Testant les changements
>
> [Procède aux changements sans critères de succès clairs]

#### ✅ Ce qu'il faut faire (Objectifs vérifiables)

Pour "fixer l'auth", il faut définir des critères de succès.
Quel problème spécifique veut-on résoudre ?

**Si le problème est :** *"Les utilisateurs restent connectés après avoir changé leur mot de passe"*

Plan :
1. **Écrire un test** : Changer le mot de passe → vérifier que la session active est invalidée
   → Vérification : Le test échoue (reproduit le bug)

2. **Implémenter** : Invalider les sessions au changement de mot de passe
   → Vérification : Le test passe

3. **Edge cases** : Sessions multiples actives, changements concurrents
   → Vérification : Tests additionnels passent

4. **Pas de régression** : Les tests auth existants passent toujours
   → Vérification : Suite de tests complète au vert

Couverture actuelle des tests auth : [voir `src/lib/__tests__/auth.test.ts`]
Quel problème d'auth observes-tu exactement ?

---

### Exemple 2 : Multi-étapes avec vérification

**Demande :** *"Ajoute du rate limiting sur l'API Riot"*

#### ❌ Ce que les LLM font (Tout d'un coup)

```ts
// Implémente Redis, multiple strategies, config system,
// monitoring en un seul commit de 300 lignes
// Sans étapes de vérification claires
```

#### ✅ Ce qu'il faut faire (Incrémental avec vérification)

Plan pour le rate limiting :

1. **Rate limiting in-memory basique** (un seul endpoint)
   Vérification :
   - Test : 20 requêtes → les 16 premières passent, le reste retourne 429
   - Manuel : `curl` l'endpoint 17 fois, voir l'erreur de rate limit

2. **Extraire en middleware** (appliquer à tous les endpoints Riot)
   Vérification :
   - Test : Le rate limit s'applique à `/api/riot/summoner` et `/api/riot/matches`
   - Les tests des endpoints existants passent toujours

3. **Ajouter un backend persistant** (Redis, pour multi-instance)
   Vérification :
   - Test : Le compteur de rate limit persiste après restart
   - Test : Deux instances partagent le même compteur

4. **Ajouter la configuration** (taux différents par endpoint)
   Vérification :
   - Test : `/api/riot/matches` permet 16 req/sec, `/api/riot/summoner` permet 20 req/sec
   - Le fichier de config est parsé correctement

Chaque étape est indépendamment vérifiable et déployable.
On commence par l'étape 1 ?

---

### Exemple 3 : Test-First Verification

**Demande :** *"Le tri des leaderboards est instable quand il y a des scores égaux"*

#### ❌ Ce que les LLM font (Fix sans reproduire)

```ts
// Change immédiatement la logique de tri sans confirmer le bug
function sortLeaderboard(players: LeaderboardEntry[]) {
  return players.sort((a, b) => b.score - a.score);
}
```

#### ✅ Ce qu'il faut faire (Reproduire d'abord)

```ts
// 1. D'abord, écrire un test qui reproduit le problème
describe('sortLeaderboard', () => {
  it('should have stable ordering for duplicate scores', () => {
    const players = [
      { name: 'Adam', score: 95 },
      { name: 'Bo', score: 95 },
      { name: 'Caps', score: 90 },
    ];

    const result = sortLeaderboard(players);

    // Le bug : l'ordre est non-déterministe pour les scores égaux
    // Ce test peut passer ou échouer selon l'implémentation de sort()
    expect(result[0].score).toBe(95);
    expect(result[1].score).toBe(95);
    expect(result[2].score).toBe(90);
  });
});

// Vérification : Le test échoue de manière intermittente

// 2. Maintenant, fixer avec un tri stable
function sortLeaderboard(players: LeaderboardEntry[]) {
  return players.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name); // Tie-breaker stable
  });
}

// Vérification : Le test passe de manière consistante (10/10 runs)
```

---

## Récapitulatif des anti-patterns

| Principe | Anti-pattern | Correction |
|----------|-------------|------------|
| Think Before Coding | Hypothèses silencieuses sur format, champs, scope | Lister les hypothèses explicitement, demander clarification |
| Simplicity First | Strategy pattern pour un calcul simple | Une fonction jusqu'à ce que la complexité soit réellement nécessaire |
| Surgical Changes | Reformater les guillemets, ajouter des types pendant un fix | Ne changer que les lignes qui corrigent le bug rapporté |
| Goal-Driven | *"Je vais réviser et améliorer le code"* | *"Écrire un test pour le bug X → le faire passer → vérifier pas de régression"* |

---

## Insight clé

> *"Les LLM sont exceptionnellement bons pour boucler jusqu'à atteindre un objectif spécifique... Ne leur dites pas quoi faire, donnez-leur des critères de succès et observez-les avancer."*
> — Andrej Karpathy

Les exemples "overcomplicated" ne sont pas *évidemment* faux — ils suivent des design patterns et des best practices. Le problème est le **timing** : ils ajoutent de la complexité avant qu'elle ne soit nécessaire, ce qui :

- Rend le code plus dur à comprendre
- Introduit plus de bugs
- Prend plus de temps à implémenter
- Est plus dur à tester

Les versions simples sont :

- Plus faciles à comprendre
- Plus rapides à implémenter
- Plus faciles à tester
- Refactorables plus tard quand la complexité est *réellement* nécessaire

> **Du bon code résout le problème d'aujourd'hui simplement, pas le problème de demain prématurément.**
