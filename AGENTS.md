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

---

## 🎨 Composants clés

- **Radar charts** : Visualisation des performances (Recharts)
- **Command palette** : Navigation rapide (Cmd+K)
- **Player cards** : Fiches joueur avec stats clés
- **Compare view** : Comparaison side-by-side
- **Admin tables** : CRUD avec pagination et filtres

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
