# 🔧 Problèmes d'optimisation Prisma identifiés

> Date : 26/04/2026
> Source : Analyse mode `--thinking` sur la codebase

---

## 🔴 CRITIQUES — N+1 Queries (à corriger en priorité)

| # | Fichier | Problème | Impact |
|---|---------|----------|--------|
| 1.1 | `src/lib/leaguepedia.ts:223` | `syncRostersWithLeaguepedia` — boucle avec `findFirst` + `update` | Jusqu'à **1,000 requêtes** par sync |
| 1.2 | `src/app/api/admin/import-csv/route.ts:40` | Import CSV — 2 boucles avec `findFirst` + `create`/`update` | **400+ requêtes** pour 100 joueurs |
| 1.3 | `src/app/api/import/oracle/route.ts:34` | Import Oracle — boucle `findFirst` + `upsert` + `update` | 3 requêtes par ligne CSV |
| 1.4 | `src/app/api/cron/check-alerts/route.ts:59` | Alertes — boucles imbriquées avec `findFirst` + `create` | **2,500+ requêtes** en charge |
| 1.5 | `src/app/api/cron/weekly-digest/route.ts:48` | Digest — boucle `findMany` par utilisateur | 2 requêtes par utilisateur |
| 1.6 | `src/app/api/prospects/recalculate/route.ts:20` | Recalcul prospects — boucle `update` + `upsert` | 2 écritures par prospect |
| 1.7 | `src/app/api/cron/sync-stats/route.ts:170` | Sync stats — appels séquentiels `syncPlayer` | Très lent pour 100+ joueurs |

**Solution générale :** Utiliser `$transaction` avec opérations batchées, ou `Promise.all` avec limite de concurrence.

---

## 🟠 HIGH — Over-fetching (récupération de données inutiles)

| # | Fichier | Problème | Impact |
|---|---------|----------|--------|
| 2.1 | `src/app/api/players/route.ts:87` | `include: { soloqStats, proStats }` sans `select` | Transfère tous les champs inutiles |
| 2.2 | `src/app/api/lists/route.ts:41` | `include` imbriqué 3 niveaux sans `select` | Charge énorme pour les listes |
| 2.3 | `src/app/api/favorites/route.ts:21` | Même problème que lists | Payload massif |
| 2.4 | `src/app/api/export/players/route.ts:36` | Export CSV sans `select` | Charge tous les champs pour export |
| 2.5 | `src/app/api/players/[id]/route.ts:12` | `reports: true`, `vods: true` sans `select` | Champs texte longs inutiles |

**Solution :** Ajouter `select` pour ne récupérer que les champs nécessaires.

---

## 🟠 HIGH — Index manquants dans Prisma

**À ajouter dans `prisma/schema.prisma` :**

```prisma
// Pour les requêtes filtrées fréquentes
@@index([role, league, status])
@@index([isProspect, prospectScore])
@@index([league, tier])
@@index([pseudo, realName])

// Pour les notifications
@@index([userId, type, createdAt])
@@index([userId, read, createdAt])

// Pour les favoris/groupés
@@index([playerId, userId])
```

---

## 🟠 HIGH — Requêtes inefficaces

| # | Fichier | Problème | Solution |
|---|---------|----------|----------|
| 4.1 | `src/app/api/similarity/route.ts:136` | Récupère TOUS les joueurs 2 fois | Fetch une seule fois, réutiliser |
| 4.2 | `src/app/api/players/[id]/percentiles/route.ts:45` | Charge tous les ProStats pour percentiles | `select` uniquement les métriques nécessaires |
| 4.3 | `src/app/api/players/[id]/radar/route.ts:87` | Même problème que percentiles | `select` les métriques radar |
| 4.4 | `src/app/api/search/suggestions/route.ts:15` | Filtre redondant en mémoire | ✅ **CORRIGÉ** — SQLite `contains` est déjà case-insensitive |
| 4.5 | `src/app/api/players/route.ts:100` | Filtre `minGames` côté client | Déplacer dans `where` Prisma (si SQLite le supporte) |

---

## 🟡 MEDIUM — Caching manquant

| # | Fichier | Problème | Solution |
|---|---------|----------|----------|
| 5.1 | `src/app/api/players/[id]/similar/route.ts` | Pas de cache pour similarité | Ajouter `unstable_cache` (TTL 5min) |
| 5.2 | `src/app/api/players/[id]/percentiles/route.ts` | Recalcule 40+ percentiles à chaque requête | `unstable_cache` (TTL 1h) |
| 5.3 | `src/app/api/players/[id]/radar/route.ts` | Même problème | `unstable_cache` |
| 5.4 | `src/app/api/search/suggestions/route.ts` | Requête DB à chaque frappe | `unstable_cache` (TTL 30s) |
| 5.5 | `src/app/api/discord/route.ts` | Commandes Discord sans cache | `unstable_cache` (TTL 5min) |
| 5.6 | `src/app/api/soloq-potw/route.ts` | POTW sans cache | `unstable_cache` |
| 5.7 | `src/app/api/v1/players/route.ts` | API publique sans cache | `unstable_cache` (TTL 60s) |

---

## 🟡 MEDIUM — Pagination manquante

| # | Fichier | Problème | Solution |
|---|---------|----------|----------|
| 6.1 | `src/app/sitemap.ts:30` | Récupère TOUS les joueurs | Ajouter `take` si >50k joueurs |
| 6.2 | `src/app/api/export/players/route.ts:36` | Export sans limite | Ajouter streaming ou limite max |
| 6.3 | `src/app/api/favorites/route.ts:21` | Favoris sans pagination | Ajouter `take: 50` + pagination |
| 6.4 | `src/app/api/lists/route.ts:41` | Listes sans pagination | Paginer les listes ou les joueurs par liste |
| 6.5 | `src/app/api/players/[id]/route.ts:12` | `proMatches` sans `take` | Ajouter `take: 50` |

---

## ✅ Quick Wins déjà faits

| # | Fichier | Action | Date |
|---|---------|--------|------|
| ✅ | `src/app/api/search/suggestions/route.ts` | Suppression filtre redondant | 26/04/2026 |

---

## 🎯 Prochaines étapes recommandées

1. **Ajouter les index** dans `prisma/schema.prisma` (10 min)
2. **Ajouter `select`** dans les API routes lists/favorites/export (30 min)
3. **Ajouter `unstable_cache`** aux endpoints percentiles/radar/similar (30 min)
4. **Corriger les N+1** dans l'import CSV et le sync rosters (1-2h)
5. **Ajouter pagination** aux favoris et listes (30 min)
