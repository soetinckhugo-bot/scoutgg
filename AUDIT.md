# 🔍 Audit Complet — LeagueScout (SCOUTGG)

**Date :** 2026-04-24  
**Scope :** Accessibilité, Performance, SEO, Sécurité, Dette Technique  
**Standards :** WCAG 2.1 AA, Core Web Vitals, OWASP Top 10

---

## 📊 Résumé Exécutif

| Domaine | Critical | High | Medium | Low | Score |
|---------|----------|------|--------|-----|-------|
| Accessibilité | 0 | 16 | 14 | 0 | 🟡 65% |
| Performance | 4 | 12 | 15 | 8 | 🔴 45% |
| SEO | 2 | 6 | 4 | 3 | 🟡 60% |
| Sécurité | 3 | 4 | 5 | 2 | 🔴 50% |
| Dette Technique | 0 | 2 | 6 | 3 | 🟡 70% |

**Score global :** 🟡 **58%** — Des progrès significatifs sont nécessaires, notamment en performance et sécurité.

---

## 1. ♿ Accessibilité (WCAG 2.1 AA)

### Problèmes Critiques / Haute Priorité (16)

| # | Problème | Fichier | Fix |
|---|----------|---------|-----|
| 1 | **Skip link manquant** — Pas de "Skip to main content" | `layout.tsx` | Ajouter `<a href="#main-content" className="sr-only focus:not-sr-only">` |
| 2 | **SheetTrigger sans aria-label** (menu mobile) | `header.tsx:305` | `aria-label="Open navigation menu"` |
| 3 | **NotificationBell sans aria-expanded/aria-label** | `NotificationBell.tsx:72` | `aria-label="Notifications, N unread" aria-expanded={open}` |
| 4 | **CommandDialog sans aria-label** | `CommandPalette.tsx:107` | `aria-label="Open command palette (Cmd+K)"` |
| 5 | **Icônes décoratives sans aria-hidden** | `page.tsx` (multiple) | `aria-hidden="true"` sur toutes les icônes Lucide décoratives |
| 6 | **AvatarFallback icône sans aria-hidden** | `header.tsx:142` | `aria-hidden="true"` sur l'icône User |
| 7 | **Search dropdown sans navigation flèches** | `header.tsx:193` | Implémenter `onKeyDown` avec ArrowUp/ArrowDown |
| 8 | **Notification dropdown sans Escape/focus trap** | `NotificationBell.tsx:86` | `useEffect` pour Escape + focus trap |
| 9 | **Saut h1 → h4** (hiérarchie headings) | `players/[id]/page.tsx:173` | Remplacer h4 par h2 stylisé |
| 10 | **Filtres sans aria-pressed** | `players/page.tsx:143` | `aria-pressed={isActive}` sur les badges interactifs |
| 11 | **Timeline events par couleur uniquement** | `players/[id]/page.tsx:660` | `aria-label={event.type}` sur chaque event |
| 12 | **Contraste muted-foreground insuffisant** | `globals.css` | `#6C757D` → `#5A6268` sur fond `#F8F9FA` |
| 13 | **ImageUpload input sans label associé** | `ImageUpload.tsx:140` | `id="photo-upload"` + `htmlFor="photo-upload"` |
| 14 | **Winrate vert/rouge sans indicateur textuel** | `players/[id]/page.tsx:397` | Ajouter "(Above/Below average)" |
| 15 | **Langue html="en" mais contenu mixte** | `layout.tsx:33` | Confirmer la langue principale du site |
| 16 | **Loading states sans aria-live** | `loading.tsx` | `aria-live="polite" aria-busy="true"` |

### Points Positifs ✅
- Dialog/Sheet ont DialogTitle + DialogDescription
- Button a `focus-visible:ring`
- alt text sur toutes les images
- ThemeToggle a `aria-label`
- shadcn/ui gère bien les ARIA de base

---

## 2. ⚡ Performance (Core Web Vitals)

### Problèmes Critiques (4)

| # | Problème | Impact | Fix |
|---|----------|--------|-----|
| 1 | **`images.unoptimized: true`** — Optimisation Next.js désactivée | LCP catastrophique | Retirer ou configurer un loader custom |
| 2 | **Aucun cache** — `unstable_cache`, `revalidate`, `Cache-Control` absents | TTFB élevé | Ajouter `unstable_cache` sur les données quasi-statiques |
| 3 | **Aucun `next/dynamic()`** — Composants lourds chargés synchrone | Bundle JS énorme | Lazy-loader charts, PDF, modals |
| 4 | **Deps inutilisées lourdes** — `@react-pdf/renderer`, `html2canvas`, `axios` | Bundle inutile | Supprimer du `package.json` |

### Problèmes Haute Priorité (12)

| # | Problème | Fichier | Fix |
|---|----------|---------|-----|
| 5 | `jspdf` importé en top-level | `ExportPdfButton.tsx:6` | `dynamic(() => import("jspdf"))` |
| 6 | `include` au lieu de `select` (Prisma) | `page.tsx`, `players/[id]/page.tsx` | `select` avec champs limités |
| 7 | Pas de `placeholder="blur"` | `PlayerCard.tsx`, `page.tsx` | Ajouter blurDataURL |
| 8 | Pas de `priority` sur images above-the-fold | `page.tsx:137` | `priority` sur l'image featured |
| 9 | Page joueur monolithique (770 lignes) | `players/[id]/page.tsx` | Splitter chaque tab en composant |
| 10 | Header monolithique (334 lignes) | `header.tsx` | Extraire Search, Auth, MobileMenu |
| 11 | `CommandPalette` chargé synchrone partout | `header.tsx:14` | `dynamic(() => import(...), { ssr: false })` |
| 12 | Pas de cache headers sur API routes | Toutes les API | `Cache-Control: s-maxage=60, stale-while-revalidate=300` |
| 13 | `discord.js` (~20MB) dans les deps | `package.json` | Vérifier usage, potentiellement supprimer |
| 14 | `display: "swap"` manquant sur fonts | `layout.tsx:11` | Ajouter à `next/font/google` |
| 15 | Pas de `loading.tsx` sur plusieurs pages | `dashboard`, `leaderboards`, `pricing` | Ajouter des skeleton loaders |
| 16 | Couleurs hardcodées en inline | Multiple | Créer des tokens Tailwind |

### Points Positifs ✅
- `next/font/google` utilisé (Geist)
- Tailwind v4 avec purge automatique
- Toutes les images passent par `next/image`
- Aucune balise `<img>` native trouvée

---

## 3. 🔍 SEO

### Problèmes Critiques (2)

| # | Problème | Fichier | Fix |
|---|----------|---------|-----|
| 1 | **Open Graph absent** — Pas d'og:image, og:title, og:description | `layout.tsx` | Ajouter `openGraph` au metadata root |
| 2 | **Twitter Cards absent** — Pas de twitter:card | `layout.tsx` | Ajouter `twitter` au metadata root |

### Problèmes Haute Priorité (6)

| # | Problème | Fichier | Fix |
|---|----------|---------|-----|
| 3 | **generateMetadata() absent** sur 18 pages | Toutes les `page.tsx` | Ajouter `export const metadata` ou `generateMetadata` |
| 4 | **Canonical URLs absentes** | Toutes les pages | `alternates: { canonical: "..." }` |
| 5 | **Structured Data (JSON-LD) absent** | `players/[id]/page.tsx` | Ajouter `ProfilePage` / `Person` JSON-LD |
| 6 | **Breadcrumb absent** | Pages profondes | Créer un composant Breadcrumb avec schema.org |
| 7 | **Sitemap incomplet** — Pages manquantes | `sitemap.ts` | Ajouter `/prospects`, `/leaderboards`, `/compare` |
| 8 | **images.unoptimized** impacte le SEO speed | `next.config.ts` | Réactiver l'optimisation d'images |

### Points Positifs ✅
- `robots.txt` correct (`/admin` et `/api/` bloqués)
- Sitemap dynamique existant
- `generateMetadata()` sur `players/[id]/page.tsx`
- Maillage interne dense et structuré
- Alt text sur toutes les images
- URLs propres et descriptives

---

## 4. 🔒 Sécurité

### Problèmes Critiques (3) — À FIXER IMMÉDIATEMENT

| # | Problème | Fichier | Fix |
|---|----------|---------|-----|
| 1 | **`NEXT_PUBLIC_CRON_SECRET` exposé côté client** | `admin/page.tsx:1036` | Retirer du client, appeler via API route |
| 2 | **Compte demo hardcodé** (`admin@leaguescout.gg` / `admin123`) | `auth-options.ts:20` | Supprimer ou protéger par `NODE_ENV !== "production"` |
| 3 | **Routes API de mutation sans auth** — `soloq-potw` POST/DELETE, `import/oracle` POST | `soloq-potw/route.ts`, `import/oracle/route.ts` | Ajouter `getServerSession` + `requireAdmin()` |

### Problèmes Haute Priorité (4)

| # | Problème | Fichier | Fix |
|---|----------|---------|-----|
| 4 | **Rate limiter in-memory** — Ne fonctionne pas en serverless | `rate-limit.ts`, `api-auth.ts` | Migrer vers Redis/Upstash |
| 5 | **XSS dans les emails** — Interpolation HTML sans échappement | `cron/weekly-digest/route.ts:124` | Utiliser `he` ou template engine avec auto-escape |
| 6 | **Upload sans validation d'extension** — `.php.jpg` possible | `upload/route.ts:39` | Forcer l'extension côté serveur (UUID + .jpg/.png) |
| 7 | **JWT sans maxAge** — Session potentiellement illimitée | `auth-options.ts:61` | Ajouter `maxAge: 30 * 24 * 60 * 60` |

### Problèmes Moyenne Priorité (5)

| # | Problème | Fichier | Fix |
|---|----------|---------|-----|
| 8 | **Zod absent** sur plusieurs routes API | `soloq-potw`, `keys`, `lists`, `org` | Créer des schémas Zod systématiques |
| 9 | **Discord webhook secret optionnel** | `discord/route.ts:16` | Rendre obligatoire (`if (secret !== expectedSecret)`) |
| 10 | **Export CSV sans auth** | `export/players/route.ts` | Restreindre aux users authentifiés |
| 11 | **CORS non configuré** sur API publiques | `api/v1/*` | Ajouter headers CORS explicites |
| 12 | **Cast `as any`** sur JWT/session | `auth-options.ts:67`, `auth.ts:8` | Typer correctement avec l'extension NextAuth |

### Vulnérabilités Connues

| Package | CVE | Sévérité | Action |
|---------|-----|----------|--------|
| `next` 15.3.2 | GHSA-r2fc-ccr8-96c4 (Cache poisoning) | Critical | Mettre à jour vers 15.3.4+ |
| `next` 15.3.2 | GHSA-9qr9-h5gf-34mp (RCE) | Critical | Mettre à jour vers 15.3.4+ |
| `postcss` | GHSA-qx2v-qp2m-jg93 (XSS) | Moderate | `npm audit fix` |
| `uuid` (via resend→svix) | GHSA-w5hq-g745-h8pq | Moderate | Surveiller les mises à jour |

---

## 5. 🏗️ Dette Technique

### Problèmes Haute Priorité (2)

| # | Problème | Fichier | Fix |
|---|----------|---------|-----|
| 1 | **ESLint rules désactivées** — `no-explicit-any`, `no-unused-vars` off | `eslint.config.mjs:16` | Réactiver les règles |
| 2 | **Aucun test** — Vitest + Playwright installés mais 0 tests | `package.json` | Ajouter des tests unitaires + E2E |

### Problèmes Moyenne Priorité (6)

| # | Problème | Fichier | Fix |
|---|----------|---------|-----|
| 3 | **~40+ `any` dans le codebase** | Multiple | Remplacer progressivement |
| 4 | **Route `/api/api-keys` dupliquée** avec `/api/keys` | `api/api-keys/route.ts` | Unifier ou supprimer |
| 5 | **Console logs en production** | Cron jobs, webhooks | Remplacer par `pino` |
| 6 | **Try/catch manquants** sur plusieurs routes API | `export/players`, `soloq-potw` | Wrapper toutes les routes |
| 7 | **SQLite en production** | `schema.prisma:6` | Migrer vers PostgreSQL/Turso |
| 8 | **Migrations non versionnées** | `prisma/migrations/` | Versionner avec `prisma migrate dev` |

---

## 🎯 Plan d'Action Priorisé

### Phase 1 : Sécurité Critique (Semaine 1) — 5 issues
- [ ] Retirer `NEXT_PUBLIC_CRON_SECRET` du client
- [ ] Supprimer le compte demo hardcodé
- [ ] Ajouter auth sur `soloq-potw` POST/DELETE
- [ ] Ajouter auth sur `import/oracle` POST
- [ ] Mettre à jour `next` vers 15.3.4+

### Phase 2 : Performance Critique (Semaine 2) — 5 issues
- [ ] Réactiver `next/image` optimization (ou configurer loader)
- [ ] Implémenter `unstable_cache` sur les données quasi-statiques
- [ ] Lazy-loader les composants lourds avec `next/dynamic()`
- [ ] Supprimer les deps inutilisées (`@react-pdf/renderer`, `html2canvas`, `axios`)
- [ ] Optimiser les requêtes Prisma (`select` au lieu de `include`)

### Phase 3 : SEO Foundation (Semaine 3) — 5 issues
- [ ] Ajouter Open Graph + Twitter Cards sur toutes les pages
- [ ] Ajouter `generateMetadata()` sur toutes les pages publiques
- [ ] Ajouter canonical URLs
- [ ] Ajouter JSON-LD structured data (ProfilePage, WebSite)
- [ ] Implémenter un composant Breadcrumb

### Phase 4 : Accessibilité (Semaine 4) — 5 issues
- [ ] Ajouter skip-to-content link
- [ ] `aria-hidden="true"` sur toutes les icônes décoratives
- [ ] `aria-label`/`aria-expanded` sur les composants interactifs
- [ ] Corriger la hiérarchie des headings
- [ ] Améliorer le contraste des couleurs

### Phase 5 : Polish & Dette (Semaine 5) — 5 issues
- [ ] Réactiver les règles ESLint strictes
- [ ] Ajouter des tests unitaires (Zod, auth, API critiques)
- [ ] Ajouter Zod sur toutes les routes API
- [ ] Remplacer les console.logs par un logger structuré
- [ ] Ajouter des `loading.tsx` sur les pages manquantes

---

## 📈 Métriques Cibles Post-Audit

| Métrique | Actuel | Cible |
|----------|--------|-------|
| Lighthouse Accessibility | ~70 | 95+ |
| Lighthouse Performance | ~45 | 80+ |
| Lighthouse SEO | ~65 | 90+ |
| Lighthouse Best Practices | ~60 | 90+ |
| Bundle JS (First Load) | ~102 kB | <80 kB |
| LCP | ~4s | <2.5s |
| TTFB | ~800ms | <200ms |
| Vulnérabilités CVE | 4 | 0 |

---

*Audit réalisé le 2026-04-24. Ce rapport est vivant — mettre à jour au fur et à mesure des corrections.*
