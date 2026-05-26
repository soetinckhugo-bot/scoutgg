# ScoutGG / LeagueScout — Récapitulatif

## 🔑 Credentials

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | `admin@leaguescout.gg` | `admin123` |

## 🎯 C'est quoi ?

Plateforme de scouting esport pour **League of Legends**. Découverte, analyse et comparaison de joueurs pros et prospects à travers plusieurs ligues (LEC, LFL, LCK, LPL, etc.).

**Public cible** : Recruteurs, coaches, managers et fans d'esport LoL.

**URL** : https://scoutgg-xve3.vercel.app

**Admin panel** : https://scoutgg-xve3.vercel.app/admin

---

## ✅ Features existantes

### Core
- [x] Grille de joueurs avec filtres (rôle, ligue, statut, tier) + pagination
- [x] Fiche joueur détaillée (stats SoloQ + Pro, radar charts, historique matchs)
- [x] Comparaison côte à côte (2-3 joueurs)
- [x] Recherche de similarités (joueurs similaires par rôle)
- [x] Prospects — Top 30 talents régionaux avec scoring algorithmique
- [x] Leaderboards dynamiques par statistique
- [x] Tier lists dynamiques

### Utilisateur
- [x] Auth (email/password) — JWT via NextAuth
- [x] Watchlist (favoris) avec notes
- [x] Listes personnalisées de joueurs
- [x] Notifications
- [x] Dashboard personnel
- [x] Export CSV des joueurs

### Premium
- [x] Rapports de scouting (gratuits + payants)
- [x] Stripe Checkout (2 plans : Supporter / Scout Pro)
- [x] Gated content (rapports premium redactés pour non-abonnés)

### Admin
- [x] Dashboard admin (CRUD joueurs, imports CSV, sync)
- [x] Import Oracle's Elixir (CSV pro stats)
- [x] Sync Riot API (SoloQ stats)
- [x] Recalcul des scores
- [x] Upload d'images (local / Vercel Blob)

### Outils
- [x] Draft Board
- [x] Scouting Cards (pipeline CRM)
- [x] Command Palette (Cmd+K)
- [x] Sitemap dynamique

---

## 🛠 Stack

| Couche | Tech |
|--------|------|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript 5 |
| UI | React 19 + Tailwind v4 + shadcn/ui |
| DB (dev) | SQLite (better-sqlite3) |
| DB (prod) | Turso / libSQL |
| ORM | Prisma 5 |
| Auth | NextAuth.js (Credentials) |
| Paiements | Stripe |
| Charts | Recharts + Chart.js |
| Tests | Vitest + Playwright + Storybook |

---

## 🏗 Architecture clé

- **Server Components** par défaut — data fetching direct via Prisma
- **Pas de Server Actions** — mutations via API Routes (`route.ts`)
- **Pas de middleware.ts** — auth via `requireAdmin()` / `requirePremium()`
- **Caching** : `unstable_cache` avec revalidation 60-300s
- **Rate limiting** : in-memory sur routes publiques
- **Scoring** : percentiles pondérés par rôle + ligue

---

## 💡 Pistes de features futures (à brainstormer)

> Copie cette section dans Kimi sur ton téléphone pour itérer.

- Annotations vidéo (timestamps VOD avec notes)
- Alertes automatiques (joueur monte en rank, change d'équipe)
- Intégration données live (matchs en cours)
- Scouting réseau (graph de connexions joueur-coach-équipe)
- Comparateur historique (évolution d'un joueur sur plusieurs saisons)
- Mobile app (PWA)
- Multi-langue (FR/EN/KR/CN)
- API publique documentée
- Discord bot avancé (commandes slash, alerts)
- Gestion de shortlists pour les recruteurs
- Heatmaps de performance par champion
- Prédictions ML (potentiel de carrière)
