# LeagueScout — Design Audit Report

> **Date**: 2026-04-26
> **Audits**: /critique (UX global) + /arrange (layout) + /typeset (typographie)
> **Auditeur**: Kimi Code CLI (skills frontend-design)

---

## 📊 Scores Récapitulatifs

| Dimension | Score | Status |
|-----------|-------|--------|
| AI Slop (critique) | ❌ FAIL | Tells détectés |
| Visual Hierarchy | 2.5/5 | À améliorer |
| Information Architecture | 3/5 | OK, surcharge d'onglets |
| Emotional Resonance | 2/5 | Pas assez différenciant |
| Layout & Spacing | 2.5/5 | Partiellement systématique |
| Typography | 2.5/5 | Arbitrary, inconsistant |
| Data Typography | 2/5 | `tabular-nums` absent |
| Color System | 2/5 | Double palette en conflit |

---

## 🔴 Verdict Anti-Patterns : FAIL — AI Slop Détecté

| Tell | Où | Preuve |
|------|-----|--------|
| **Cyan-on-dark** | `globals.css` legacy | `--color-accent-cyan: #4ECDC4` |
| **Violet/néon** | `globals.css` legacy | `--color-accent-violet: #A855F7` |
| **Hero metrics** | Homepage, Dashboard | Big number + small label partout |
| **Card grids identiques** | Players, Reports, Pricing | Même formule `bg-[#141621] border-[#2A2D3A]` |
| **Police générique** | `layout.tsx` | Geist Sans = default Next.js 15 |
| **Glassmorphism** | ReportCard preview | `backdrop-blur-sm` sur contenu locked |
| **Gradient text** | Dashboard POTW | `bg-gradient-to-br from-amber-50...` |
| **Dark + accents néon** | Radar, tiers | `#00D9C0`, `#00E676`, `#FFD93D` — arc-en-ciel |

**Problème fondamental** : Deux palettes en conflit — une navy professionnelle (`#1A1A2E`, `#E94560`) et un arc-en-ciel AI slop (cyan, magenta, violet, gold) qui pollue encore `globals.css` et `constants.ts`.

---

## 🎯 5 Problèmes Prioritaires

### P1 — Crise d'identité : Light vs Dark Mode
- **Quoi** : L'app supporte les deux modes, mais le light est hostile au use case (scouts en salle sombre). La homepage est light, puis la section POTM est dark — mode dans le mode.
- **Impact** : Maintenance infernale (`dark:` partout), experience incohérente, light mode inutile pour la cible.
- **Fix** : **Tuer le light mode**. Dark only. Supprimer tous les `dark:`, `bg-white`, et valeurs light. Standardiser sur 3 tons : surface (`#0A0A12`), elevated (`#12121E`), highlight (`#1A1A2E`).
- **Command** : `/colorize`

### P2 — Explosion de tags arc-en-ciel
- **Quoi** : 20 behavior tags × couleurs uniques + 5 roles colorés + 6 tiers colorés = sapin de Noël.
- **Impact** : Chaos visuel. Pour une plateforme qui vend "précision", le système de couleur est incohérent. Le tier B en cyan et C en violet sont particulièrement choquants.
- **Fix** : Tags behavior → **2 couleurs max** (positif = vert muted, négatif = rouge muted, neutre = gris). Roles → monochrome avec texte. Tiers → gradient unique warm-to-cool (S = or, C = slate).
- **Command** : `/colorize`

### P3 — Typographie sans intention
- **Quoi** : Geist Sans est le default Next.js — pas différenciant. Hiérarchie muddle : `text-3xl` h1 puis `text-sm` h2 = saut de 5 niveaux. `text-[10px]` utilisé 80+ fois.
- **Impact** : L'interface ne respire pas "précise" et "puissante". Tout est au même niveau visuel.
- **Fix** : Échelle typographique systématique (9 tailles). Éliminer tous les `text-[9px]`, `text-[10px]`, `text-[11px]`. Standardiser les poids (400/500/600/700). Créer des composants typographiques sémantiques.
- **Command** : `/typeset`

### P4 — Hero metrics sans contexte
- **Quoi** : "42 Player Profiles", "Score Global: 87/100" — grands nombres, zéro sens. La méthodologie du score est invisible.
- **Impact** : Les scouts sont sceptiques de chiffres sans méthode. Ça mine la confiance.
- **Fix** : Remplacer les vanity metrics par du contenu actionnable ("3 free agents LFL cette semaine"). Ajouter tooltips sur les scores expliquant le calcul.
- **Command** : `/clarify`

### P5 — Surcharge d'onglets (11 onglets !)
- **Quoi** : Player detail a 11 onglets : Stats, Radar, Percentiles, SoloQ, Pro Matches, Champions, History, Similar, Timeline, Reports, VODs.
- **Impact** : Surcharge cognitive. L'organisation est autour des *données disponibles*, pas des *tâches utilisateur*.
- **Fix** : Regrouper en 4 onglets task-based : `Overview` (stats + radar + percentiles clés), `Matches` (SoloQ + Pro avec filtres), `Analysis` (reports + timeline + similar), `Media` (VODs + champion pool).
- **Command** : `/arrange`

---

## 📐 Layout & Espacement — Problèmes Clés

### Spacing : Partiellement systématique
- Valeurs arbitraires : `text-[10px]`, `px-1.5`, `py-0.5`, `gap-[1px]`
- Padding sections sans pattern : `py-8`, `py-12`, `py-16` utilisés au hasard
- Deux langages visuels : shadcn tokens (`border-border`) vs legacy hex (`#2A2D3A`)

### Card Overuse (Score monotonie : 4/5)
- Player cards, report cards, pricing cards, admin stats — tous identiques
- Bio wrappée dans un `<Card>` pour un seul paragraphe
- Compare page : 6 cards en ligne, toutes `bg-[#141621] border border-[#2A2D3A]`

### Centering Overuse (Score : 4/5)
- Hero, stats bar, CTA, compare headers, compare stat rows — tout centré
- Seuls admin table et player detail header sont left-aligned

### Density mismatch
| Page | Actuel | Cible |
|------|--------|-------|
| Similarity | Low (step cards `p-6`) | Medium (résultats below fold) |
| Compare | Medium | High (trop de padding) |
| Admin | Medium | High (stats cards gaspillent l'espace) |

### Recommandations layout
1. **Système spacing** : tokens `micro/xs/sm/md/lg/xl/2xl/3xl/4xl`
2. **Réduire cards de 30%** — utiliser des divs simples pour contenu statique
3. **Layout asymétrique player detail** : `grid-cols-[1fr_320px]` avec sidebar
4. **Compare page left-aligned** — seule la colonne centrale reste centrée
5. **Filters collapsibles** sur players page

---

## 🔤 Typographie — Problèmes Clés

### Échelle : Arbitrary, pas systématique
| Taille | Usage | Verdict |
|--------|-------|---------|
| `text-[9px]` | Social cards | ❌ Trop petit |
| `text-[10px]` | 80+ endroits | ❌ Arbitrary |
| `text-[11px]` | Stat labels | ❌ Arbitrary |
| `text-sm` (14px) | Body default | ⚠️ Sous 16px min |

### Hiérarchie : 2.5/5
- Player detail : `h1 text-3xl` → `h2 text-sm` = saut de 5 niveaux
- Section headers varient : `text-sm uppercase` vs `text-2xl` vs `text-xs uppercase`
- Poids : Medium (500) vs Semibold (600) quasi indiscernable sur fond sombre

### Consistency : 2/5
- Noms joueurs : `font-semibold` (PlayerCard) vs `font-bold` (page) vs `font-semibold` (SimilarPlayers)
- Section headers : `font-bold` ou `font-semibold` au hasard
- `tracking-widest` uniquement sur compare page

### Data Typography : 2/5
- `tabular-nums` quasi absent — seulement dans `PercentileBars.tsx`
- Manquant dans : tables, stat grids, compare page, KDA displays
- `font-mono` sous-utilisé — seulement 3 endroits

### Recommandations typographie
1. **Échelle systématique** (9 tailles, ratio 1.25)
2. **Éliminer** `text-[9px]`, `text-[10px]`, `text-[11px]`
3. **Body minimum** `text-base` (16px)
4. **`tabular-nums` sur toutes les données numériques**
5. **`font-mono` pour KDA, stats, pourcentages**
6. **Composants typographiques sémantiques** (`PageTitle`, `SectionHeader`, `DataValue`)
7. **Line-height 1.6 en dark mode**
8. **Max-width 65ch** pour bios et rapports

---

## 🎨 Système de Couleur — Problèmes Clés

### Double palette en conflit
```
Palette A (professionnelle) :
  #1A1A2E (navy), #16213E, #0F3460, #E94560 (coral)

Palette B (AI slop) :
  #4ECDC4 (cyan), #FF6B6B (magenta), #A855F7 (violet),
  #FFD93D (gold), #45B7D1 (blue), #22C55E (green)
```

### Surfaces sombres : 5 gris quasi-identiques
`#0f1117`, `#141621`, `#1A1D29`, `#1A1F2E`, `#232838` — aucune sémantique claire

### Tiers : Arc-en-ciel
S+ = cyan `#00D9C0`, S = vert `#00E676`, A = or `#FFD93D`, B = cyan `text-cyan-400`, C = violet — incohérent

### Recommandations couleur
1. **Tuer Palette B** — supprimer tous les tokens legacy cyan/magenta/violet
2. **3 tons dark** : surface (`#0A0A12`), elevated (`#12121E`), highlight (`#1A1A2E`)
3. **Tiers** : gradient warm-to-cool (S+ = or chaud → C = slate froid)
4. **Roles** : monochrome + texte
5. **Behavior tags** : 2 couleurs max (vert/rouge muted + gris)
6. **Accent unique** : `#E94560` coral pour CTAs uniquement

---

## ✅ Ce qui Fonctionne

1. **Architecture de l'information** — Le système d'onglets sur player detail organise bien les données denses
2. **Densité fonctionnelle** — Les cartes joueurs montrent rôle + ligue + statut + équipe + score sans surcharge
3. **Search autocomplete** — Header avec dropdown, keyboard nav, avatars — bien exécuté
4. **Responsive grids** — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` appliqué systématiquement
5. **shadcn/ui base** — Bonne fondation de composants, tokens sémantiques en place

---

## 📋 Plan d'Action Priorisé

### Phase 1 — Fondations (High Impact, Low Effort)
- [ ] **Tuer le light mode** — Supprimer `dark:` prefixes, standardiser dark only
- [ ] **Nettoyer Palette B** — Supprimer tokens cyan/magenta/violet legacy
- [ ] **Système spacing** — Remplacer valeurs arbitraires par tokens
- [ ] **Échelle typographique** — Éliminer `text-[9/10/11px]`, standardiser 9 tailles
- [ ] **`tabular-nums` partout** — Tables, stats, KDA, pourcentages

### Phase 2 — Structure (High Impact, Medium Effort)
- [ ] **Regrouper onglets player detail** — 11 → 4 onglets task-based
- [ ] **Layout asymétrique** — Player detail avec sidebar
- [ ] **Compare page left-aligned** — Seule colonne centrale centrée
- [ ] **Réduire cards de 30%** — Divs simples pour contenu statique
- [ ] **Filters collapsibles** — Players page

### Phase 3 — Polish (Medium Impact, Medium Effort)
- [ ] **Composants typographiques sémantiques** — `PageTitle`, `SectionHeader`, `DataValue`
- [ ] **Behavior tags 2 couleurs** — Vert/rouge muted + gris
- [ ] **Tiers gradient warm-to-cool** — S+ or → C slate
- [ ] **Roles monochrome** — Texte labels, pas color-coded
- [ ] **Hero metrics actionnables** — Remplacer vanity par contenu utile

### Phase 4 — Différenciation (High Impact, High Effort)
- [ ] **Police headings différenciante** — Grotesque sharp ou condensed sans
- [ ] **Animations purpose-driven** — Staggered reveals, pas micro-interactions décoratives
- [ ] **Empty states guidants** — "Clear filters", "Browse players", actions claires
- [ ] **Loading skeletons** — Remplacer spinners par skeleton screens
- [ ] **Shareable report visual** — Format "scout report" pour présentation

---

## ❓ Questions à Considérer

1. **"Et si l'interface assumait que tout utilisateur est un scout payant ?"** — Le split free/premium crée du bruit visuel.
2. **"Un scout a-t-il besoin de *toutes* ces données, ou juste celles qui répondent à sa question actuelle ?"** — Le player detail est un data dump.
3. **"Qu'est-ce qui ferait qu'un manager screenshot et envoie à son GM ?"** — Rien n'est shareable ou mémorable visuellement.
4. **"Pourquoi la surface la plus sombre (#0f1117) paraît plus claire qu'elle ne devrait ?"** — Trop de blue-gray. Et si le fond était vraiment noir-adjacent (`#050508`) ?
5. **"Et si la couleur de marque n'était pas le rouge ?"** — `#E94560` signale danger/perte en esports. Et si c'était un steel-blue ou un or muted — autorité plutôt qu'alarme ?

---

*Rapport généré par audit design complet — critique + arrange + typeset*
