# LeagueScout — Project Status & Roadmap

> **Last updated:** 2026-04-24
> **Stack:** Next.js 15.3.2 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + Prisma 5.22.0 + SQLite (dev) → PostgreSQL (prod)
> **APIs:** Riot Games API, Stripe

---

## ✅ COMPLETED FEATURES

### Core Platform
- [x] Landing page with POTM (Player of the Month) hero
- [x] Players grid with search, filters, sorting, **pagination (9/page)**
- [x] Player detail page with stats, reports, VODs
- [x] Search page with results
- [x] Reports page (free + premium with paywall)
- [x] Tier Lists page
- [x] Pricing page with Stripe integration
- [x] About page
- [x] **Contact page**
- [x] Admin dashboard (full CRUD: players + reports) with **pagination**
- [x] Watchlist / Favorites page (per-user)
- [x] Player comparison page (2-3 players side-by-side)

### Data & APIs
- [x] Prisma schema with Player, SoloqStats, ProStats, Report, Vod, Favorite, User models
- [x] SQLite database with seeded demo data
- [x] Riot Games API integration (summoner lookup, ranked stats, match history)
- [x] SoloQ stats sync button on player detail page
- [x] Search autocomplete API (suggestions in header)
- [x] **Rate limiting** on Riot sync (5 req/min per IP)

### Auth & Security
- [x] NextAuth.js v4 configured (Credentials provider)
- [x] Login page (`/login`)
- [x] Admin protection (`/admin` layout + API routes)
- [x] Zod input validation on all API routes
- [x] Role-based access (admin vs user)

### UI/UX
- [x] Light + Dark mode toggle (next-themes)
- [x] Toast notifications (Sonner) on all actions
- [x] Loading skeletons for players/reports/search/watchlist
- [x] Responsive design (mobile menu, adaptive grids)
- [x] Reusable components: PlayerCard, ReportCard, FavoriteButton, CompareBar
- [x] Shared constants (roleColors, statusColors, tierColors)
- [x] Image upload with drag-and-drop in admin
- [x] PDF export for player scouting reports

### Filters & Sorting
- [x] Role filter (TOP, JUNGLE, MID, ADC, SUPPORT)
- [x] League filter (LEC, LFL, LFL_D2, LVP, Prime League)
- [x] Status filter (Free Agent, Under Contract, Academy, Substitute)
- [x] Sort by: Name, Rank (LP), Winrate, Age

### SEO
- [x] Dynamic metadata on player detail pages
- [x] `robots.txt`
- [x] `sitemap.xml` (dynamic, includes all players)

### Performance
- [x] Database indexes (role, league, status, isFeatured, pseudo, playerId, etc.)
- [x] Pagination on players grid and admin tables

---

## 🟡 MEDIUM PRIORITY (Nice to have before launch)

### 12. ANALYTICS ✅
- Vercel Analytics installed and active in root layout

### 15. IMAGE OPTIMIZATION
- Uses raw `<img>` tags instead of Next.js `<Image>`
- Missing `width`/`height` causes layout shift (CLS)

### 22. STRIPE WEBHOOKS ✅
- Handles 6 events: checkout.completed, invoice.succeeded/failed, subscription.updated/deleted, charge.refunded
- Premium status synced automatically

---

## 🟢 LOW PRIORITY (Post-launch)

- Auto-sync SoloQ stats (cron job)
- Match history timeline
- Champion pool charts
- Player tags
- Contract expiry tracking
- Team profiles
- Scout profiles
- Comments on reports
- Email notifications
- Mobile app / PWA
- Public API for partners

---

## 🏗️ ARCHITECTURE DECISIONS

### Database
- **SQLite** for development (simple, file-based)
- **PostgreSQL** planned for production (Vercel Postgres)
- **No enums** (SQLite limitation) — roles/statuses stored as strings
- **Indexes** added for performance on frequently queried fields

### Authentication
- NextAuth.js v4 with Credentials provider
- Admin account: `admin@leaguescout.gg` / `admin123`
- JWT session strategy
- Role-based access control

### Payments
- Stripe Checkout for Scout Pass subscription
- Webhook handling active (6 events: checkout, invoice, subscription, refund)

### File Upload
- Local file system (`public/uploads/players/`)
- **Not suitable for production** — use Vercel Blob or S3

### Riot API
- Rate limited to ~16 req/sec (in-memory, per-process)
- Additional rate limit: 5 sync requests/minute per IP
- Region: EUW1 (Europe West)

---

## 📁 KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Demo data (Adam only) |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/riot-api.ts` | Riot Games API client |
| `src/lib/auth-options.ts` | NextAuth configuration |
| `src/lib/schemas.ts` | Zod validation schemas |
| `src/lib/rate-limit.ts` | In-memory rate limiter |
| `src/app/layout.tsx` | Root layout with ThemeProvider |
| `src/components/layout/header.tsx` | Header with search autocomplete |
| `src/app/admin/page.tsx` | Admin dashboard |
| `src/app/api/riot/sync/route.ts` | Sync SoloQ stats from Riot |
| `src/app/api/upload/route.ts` | Image upload endpoint |

---

## 🎯 PRODUCTION READINESS: ~92%

**Blockers for launch:**
1. ~~Authentication~~ ✅
2. ~~Stripe checkout~~ ✅
3. ~~Input validation~~ ✅
4. ~~Pagination~~ ✅

**Nice to have before launch:**
- ~~Analytics~~ ✅
- ~~Image optimization (`<Image />`)~~ ✅
- ~~Stripe webhooks~~ ✅
- Data Completeness Dashboard ✅
- Scouting Pipeline (Kanban) ✅
- Notifications system ✅

---

## 💡 IDEAS FOR FUTURE FEATURES

- **Auto-sync SoloQ stats** — Cron job to refresh stats daily
- **Match history timeline** — Visual timeline of recent games
- **Champion pool charts** — Pie/bar charts with recharts
- **Player tags** — "Aggressive", "Macro-focused", etc.
- **Contract expiry tracking** — Alerts when contracts end
- **Team profiles** — Team pages with roster
- **Scout profiles** — Author bios, expertise areas
- **Comments on reports** — Community discussion
- **Email notifications** — New reports, player updates
- **Mobile app** — React Native or PWA
- **API for partners** — Public read-only API with API keys
