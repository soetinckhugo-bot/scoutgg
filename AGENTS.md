# AGENTS.md — ScoutGG Web (Next.js App)

## 🎯 Vue d'ensemble

Application Next.js 15 avec App Router. Plateforme de scouting esport pour League of Legends.

---

## 📁 Structure des dossiers clés

| Dossier | Contenu |
|---------|---------|
| `src/app/` | Routes et pages (App Router) |
| `src/components/` | Composants React réutilisables |
| `src/lib/` | Utilitaires, logique métier |
| `src/lib/scoring.ts` | Moteur de scoring (percentiles pondérés) |
| `src/lib/prisma.ts` | Client Prisma |
| `prisma/schema.prisma` | Schéma de base de données |
| `public/uploads/` | Images uploadées (local) |

---

## 🛣 Routes principales

| Route | Feature |
|-------|---------|
| `/` | Landing page |
| `/players` | Grille de joueurs avec filtres |
| `/players/[id]` | Détail joueur (stats, rapports, radar) |
| `/compare` | Comparaison côte à côte |
| `/similarity` | Recherche de joueurs similaires |
| `/reports` | Rapports de scouting |
| `/prospects` | Découverte de talents |
| `/watchlist` | Favoris utilisateur |
| `/tierlists` | Tier lists dynamiques |
| `/leaderboards` | Classements |
| `/draft-board` | Outil de draft |
| `/dashboard` | Dashboard utilisateur |
| `/admin` | CRUD admin complet |
| `/api/*` | 25+ routes API |

---

## 🗄 Modèles de données clés (Prisma)

- `Player` — Profils joueurs (rôle, ligue, équipe, statut)
- `SoloqStats` / `ProStats` — Stats ranked et pro
- `ProMatch` — Historique des matchs
- `ProspectMetrics` — Scoring détaillé
- `Report` — Rapports de scouting (gratuit/premium)
- `User` / `Organization` — Auth et multi-tenant
- `Favorite` / `PlayerList` — Watchlists

### ⚠️ Distinction critique : `ProStats` vs `ProMatch`

| Table | Source | Usage | Scoring |
|-------|--------|-------|---------|
| **`ProStats`** | Import CSV (Oracle's Elixir / Gol.gg) | Stats agrégées (KDA, CSPM, DPM, GD@15, vision, etc.) | ✅ **OUI** — `globalScore`, `tierScore`, `tier` calculés depuis ces stats |
| **`ProMatch`** | Saisie manuelle / import match-by-match | Historique détaillé de chaque game (champion, build, runes) | ❌ **NON** — Sert UNIQUEMENT à l'affichage des onglets **Matches** et **Champ Pool** |

> **Règle d'or** : Ajouter des `ProMatch` met à jour l'historique et le champion pool, mais ne touche **aucunement** aux scores. Pour mettre à jour les scores, modifier `ProStats` (CSV import) ou relancer `prisma/recalculate-scores.ts`.

---

## 🎨 Design System

### Fichiers clés
- `src/styles/design-system.ts` — Tokens (couleurs, typographie, spacing, composants)
- `src/components/layout/PageSection.tsx` — Wrapper de section standard
- `src/components/layout/SectionHeader.tsx` — Titre + sous-titre de section
- `src/components/ui/DarkCard.tsx` — Carte sombre réutilisable

### Palette (Dark Mode)
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#E94560` | CTAs, badges, accents |
| Secondary | `#0F3460` | Liens, graphiques |
| BG Page | `#0F0F1A` | Fond de page |
| BG Card | `#141621` | Surfaces de cartes |
| BG Card Header | `#1A1D29` | En-têtes, hover |
| Text Heading | `#E9ECEF` | Titres, noms |
| Text Body | `#A0AEC0` | Descriptions |
| Text Muted | `#6C757D` | Labels, métadonnées |
| Border | `#2A2D3A` | Bordures, séparateurs |
| Border Hover | `#3A3D4A` | Hover states |

### Composants clés
- **Radar charts** : Visualisation des performances (Recharts)
- **Command palette** : Navigation rapide (Cmd+K)
- **Player cards** : Fiches joueur avec stats clés
- **Compare view** : Comparaison side-by-side
- **Admin tables** : CRUD avec pagination et filtres
- **Flag** : Drapeaux pays (`react-flagkit`)

---

## 🔌 Intégrations externes

| Service | Usage | Fichier clé |
|---------|-------|-------------|
| Stripe | Paiements abonnements | `src/lib/stripe.ts` |
| NextAuth | Authentification | `src/lib/auth.ts` |
| Riot API | Stats live SoloQ | `src/lib/riot.ts` |
| Resend | Emails | `src/lib/email.ts` |
| Sentry | Monitoring erreurs | `sentry.client.config.ts` |

---

## 🧪 Tests

- **Unitaires** : Vitest + Testing Library (`*.test.ts`)
- **E2E** : Playwright (`e2e/`)
- **Storybook** : Documentation visuelle des composants

---

## 📝 Conventions spécifiques

- Server components par défaut, client components uniquement quand nécessaire
- Prisma queries directement dans les server components
- `unstable_cache` pour les données fréquemment lues
- Images : préférer `<Image />` de Next.js (⚠️ pas encore partout)
- Dark/light mode via `next-themes`

---

## 🚨 Points d'attention

- SQLite en dev = pas d'enums (utiliser des string literals)
- Rate limiting Riot API : ~16 req/sec
- Upload images local uniquement (pas de CDN)
- Pas de webhooks Stripe encore implémentés

## ⚠️ Règles de prudence (ajoutées suite à des incidents)

### Casse des noms / pseudos
- **Jamais** faire de comparaison stricte (`===`, `!==`) sur des pseudos, noms, ou identifiants textuels sans normaliser la casse (`toLowerCase()` / `toUpperCase()`).
- **Toujours** utiliser des requêtes Prisma insensibles à la casse (`mode: 'insensitive'`) ou normaliser avant comparaison.
- Exemple d'erreur à ne pas reproduire : supprimer un joueur `"Space"` car le script cherchait `"SPACE"`.
- **Vérification obligatoire** : avant toute suppression en batch, lister les éléments concernés et demander confirmation explicite si des données manuelles ou importantes sont potentiellement impactées.

### Seed / Scripts de nettoyage — DONNÉES EXISTANTES
- **INTERDICTION ABSOLUE** d'utiliser `DELETE FROM` global ou `deleteMany()` sans clause `WHERE` restrictif dans un seed ou script de maintenance.
- Un seed doit utiliser `upsert()` ou `findFirst` + `create` (skip if exists). Il ne doit **jamais** effacer des données utilisateur ou importées.
- Si un seed doit "réinitialiser" une entité démo (ex: Adam), cibler **uniquement** cet ID spécifique : `deleteMany({ where: { id: 'player_1' } })`.
- **Avant de relancer un seed**, toujours relire son contenu pour vérifier qu'il n'y a pas de suppression globale.
- Exemple d'erreur à ne pas reproduire : `DELETE FROM Player` dans `prisma/seed.ts` qui a supprimé tous les joueurs importés par l'utilisateur.
