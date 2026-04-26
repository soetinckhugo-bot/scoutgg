# LeagueScout — Audit Optimize + Harden + Polish

> **Date**: 2026-04-26
> **Audits**: /optimize (performance) + /harden (robustesse) + /polish (finitions)

---

## 📊 Scores Récapitulatifs

| Audit | Score | Verdict |
|-------|-------|---------|
| **/optimize** | ⚠️ C | 466KB First Load JS, pas de code splitting |
| **/harden** | ⚠️ 6/10 | Bonne base, gaps critiques sécurité |
| **/polish** | ⚠️ Décent | 1000+ couleurs hardcodées, fragmentation visuelle |

---

## 🔴 /optimize — Performance

### Verdict : SUBOPTIMAL — 466KB First Load JS

| Catégorie | Score | Problème #1 |
|-----------|-------|-------------|
| Bundle Size | ⚠️ C | Pas de dynamic imports pour charts |
| Image Optimization | ⚠️ C | 4 `<img>` tags sans next/image |
| Code Splitting | 🔴 D | 1 seul `dynamic()` dans toute l'app |
| Data Fetching | ⚠️ C | Cache key broken, pas de headers cache API |
| CSS/Tailwind | ✅ B | Tailwind v4 purging OK |
| JS Execution | ⚠️ C | 2 libs charts simultanées |
| Font Loading | ✅ A | `display: swap`, subsets OK |

### P0 — Issues Critiques

| # | Problème | Fix | Impact |
|---|----------|-----|--------|
| 1 | Pas de code splitting charts | `next/dynamic()` sur tous les composants charts | **-80KB** first load |
| 2 | Dual chart libraries (recharts + chart.js) | Migrer RadarChart.tsx vers recharts, supprimer chart.js | **-60KB** bundle |
| 3 | Player detail fetch TOUTES les données | `select` au lieu de `include`, fetch par onglet | Réduction massive |
| 4 | Cache key `unstable_cache` broken | `["player", id]` au lieu de `["player-detail"]` | Cache fonctionnel |
| 5 | CommandPalette chargée sur chaque page | `next/dynamic()` lazy load | **-30KB** first load |

### Quick Wins (10 min chacun)

- Ajouter `optimizePackageImports` dans `next.config.ts`
- Ajouter `Cache-Control` headers sur API routes stables
- Remplacer `<img>` par `next/image`
- Ajouter `compiler.removeConsole` en production

### Impact estimé P0+P1 : **~200KB réduction (43% improvement)**

---

## 🛡️ /harden — Robustesse

### Verdict : ADEQUATE (avec gaps critiques)

| Catégorie | Score | Problème #1 |
|-----------|-------|-------------|
| Error Handling | 6/10 | Bon serveur, faible client |
| Edge Cases — Data | 7/10 | La plupart des nulls gérés |
| Edge Cases — UI | 6/10 | Overflow partiel, admin mobile faible |
| Form Validation | 8/10 | Zod solide, gap XSS dans notes |
| API Robustness | 6/10 | Rate limiting flawed, auth manquante |
| State Management | 5/10 | Race conditions favorites |
| Third-Party | 7/10 | Retry Riot OK, pas de circuit breaker |

### P0 — Vulnérabilités Critiques

| # | Vulnérabilité | Scénario | Fix |
|---|---------------|----------|-----|
| CV-1 | Unhandled promise rejections | Réseau coupé → white screen | try/catch sur tous les fetch |
| CV-2 | Auth manquante `/api/players/[id]/matches` | Bot scrape tous les matchs | Ajouter `getServerSession` |
| CV-3 | Auth manquante `/api/players/[id]/pro-matches` | Scraping pro matches | Ajouter session check |
| CV-4 | Rate limiter in-memory (Map) | Cold start Vercel = bypass limit | Redis/Vercel KV |
| CV-5 | `player.pseudo[0]` crash | Pseudo vide → runtime error | `(player.pseudo?.[0] ?? '?')` |

### P1 — Vulnérabilités Importantes

| # | Vulnérabilité | Fix |
|---|---------------|-----|
| CV-6 | `JSON.parse(behaviorTags)` sans fallback robuste | try/catch + log Sentry |
| CV-7 | XSS risk dans watchlist notes | Valider URLs `http/https` uniquement |
| CV-8 | CSRF protection manquante | Ajouter tokens CSRF ou check Origin |
| CV-9 | Stripe webhook crée users non vérifiés | Vérifier `metadata.userEmail` |
| CV-10 | `requireAdmin()` après parsing form data | Déplacer auth en premier |

### Quick Hardening Wins

1. Défensive `pseudo[0]` checks partout
2. Global unhandled rejection handler
3. Fix `ReportCard.tsx` null crash (`strengths.split(",")`)
4. Auth sur `/api/players/[id]/matches`
5. URL protocol validation dans `formatNotes`
6. `AbortController` sur tous les fetch client

---

## ✨ /polish — Finitions

### Verdict : Décent — fondation solide, fragmentation applicative

### Critical

| # | Problème | Où | Fix |
|---|----------|-----|-----|
| 1 | **1000+ couleurs hardcodées** | Toutes les pages | Remplacer par tokens sémantiques |
| 2 | **Border radius chaos** | 352 instances | `rounded-full` pills, `rounded-lg` buttons, `rounded-xl` cards |
| 3 | **Shadow scale inexistant** | Design tokens définis mais jamais utilisés | Implémenter échelle sémantique |
| 4 | **Focus rings inconsistantes** | `ring-2`, `ring-3`, `[3px]`, aucune | Standardiser `focus-visible:ring-2 ring-ring/50` |

### Important

| # | Problème | Où | Fix |
|---|----------|-----|-----|
| 5 | Header buttons custom (pas `<Button>`) | `header.tsx:386` | Utiliser `<Button variant="ghost" size="sm">` |
| 6 | Hero CTAs raw `<a>` tags | `page.tsx:206` | Utiliser `<Button asChild size="lg">` |
| 7 | Card padding inconsistant | Partout | Standardiser `p-4` default, `p-3` compact |
| 8 | Icon size chaos | 288 instances | `size-4` buttons, `size-5` headers, `size-3.5` inline |

### Minor

| # | Problème | Fix |
|---|----------|-----|
| 9 | Typography line-height manquant | Ajouter `leading-tight` aux composants |
| 10 | Transition timing chaos | Standardiser : 150ms micro, 200ms state, 300ms page, 500ms data |
| 11 | `rounded-[4px]` arbitrary | `rounded-sm` |
| 12 | `h-* w-*` vs `size-*` | Uniformiser vers `size-*` |

### The "Last 10%" (Premium Feel)

1. **Micro-interactions cards** — Spring easing sur hover
2. **Scrollbar custom** — WebKit scrollbar matching dark theme
3. **Skeleton shimmer** — `linear-gradient` animation au lieu de `animate-pulse`
4. **Active tab indicator** — Animation slide au lieu de fade
5. **Button press states** — `active:scale-[0.98]` tactile
6. **Z-index hierarchy** — Tokens sémantiques (`z-dropdown`, `z-modal`, `z-toast`)
7. **Gradient consistency** — Supprimer le gradient one-off ou l'adopter partout
8. **Loading state unified** — `PageLoader` component unique

---

## 📋 Plan d'Action Priorisé

### Phase 5 — Performance (P0)
- [ ] Code splitting charts avec `next/dynamic()`
- [ ] Migrer RadarChart.tsx de chart.js vers recharts
- [ ] Supprimer chart.js des dépendances
- [ ] Optimiser `getPlayer` avec `select` au lieu de `include`
- [ ] Lazy-load CommandPalette
- [ ] Fix cache key `unstable_cache`
- [ ] Ajouter `optimizePackageImports` dans next.config.ts
- [ ] Ajouter cache headers sur API stables

### Phase 6 — Robustesse (P0)
- [ ] try/catch sur tous les fetch client
- [ ] Auth sur `/api/players/[id]/matches`
- [ ] Auth sur `/api/players/[id]/pro-matches`
- [ ] Rate limiter Redis/Vercel KV
- [ ] Défensive `pseudo[0]` checks
- [ ] Fix ReportCard null crash
- [ ] URL validation dans watchlist notes
- [ ] `requireAdmin()` en premier dans admin routes

### Phase 7 — Polish (Critical → Important)
- [ ] Éliminer 1000+ couleurs hardcodées
- [ ] Standardiser border-radius hierarchy
- [ ] Implémenter shadow scale sémantique
- [ ] Standardiser focus rings
- [ ] Header buttons avec `<Button>`
- [ ] Hero CTAs avec `<Button>`
- [ ] Standardiser card padding
- [ ] Uniformiser icon sizes (`size-*`)

### Phase 8 — Last 10%
- [ ] Scrollbar custom dark theme
- [ ] Skeleton shimmer effect
- [ ] Active tab slide animation
- [ ] Button press `scale-[0.98]`
- [ ] Z-index hierarchy tokens
- [ ] PageLoader component unified

---

## Résumé Global des 7 Audits

| Audit | Date | Score | Focus |
|-------|------|-------|-------|
| **Audit 1** (technique) | Avant Phase 1 | C → B+ | Accessibilité, performance, responsive, theming |
| **/critique** (UX) | Début session | ❌ AI Slop | Hiérarchie, architecture, résonance |
| **/arrange** (layout) | Début session | 2.5/5 | Spacing, grids, rhythm |
| **/typeset** (typo) | Début session | 2.5/5 | Échelle, hiérarchie, data typography |
| **/optimize** (perf) | Cette session | ⚠️ C | Bundle, code splitting, images |
| **/harden** (robustesse) | Cette session | ⚠️ 6/10 | Errors, edge cases, sécurité |
| **/polish** (finitions) | Cette session | ⚠️ Décent | Couleurs, radius, shadows, focus |

**Corrections déjà faites** : Phases 1-4 (110+ fichiers)
**Corrections restantes** : Phases 5-8
