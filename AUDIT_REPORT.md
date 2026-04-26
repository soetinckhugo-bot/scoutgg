# LeagueScout Web Application — Comprehensive Audit Report

**Date:** 2026-04-26  
**Auditor:** Kimi Code CLI (Audit Skill)  
**Scope:** Player Profile, Header, Footer, Similarity/Comparator, Radar Chart, Percentiles, ProStatsFull, Admin Dashboard  
**Framework:** Next.js 15 App Router, Tailwind CSS v4, shadcn/ui, Chart.js  
**Theme:** Dark-first esports analytics SaaS  

---

## Anti-Patterns Verdict

**Verdict: PARTIAL PASS** — The interface shows clear signs of AI-assisted generation mixed with genuine design intent. Specific tells:

| Tell | Evidence | Severity |
|------|----------|----------|
| **AI color palette** | `#00D9C0` (cyan), `#00E676` (green), `#FFD93D` (gold), `#FF6B6B` (red) tier colors — the classic "esports dashboard" rainbow | Medium |
| **Dark mode with glowing accents** | Heavy use of `bg-[#141621]`, `border-[#2A2D3A]` with `#E94560` accent glow on hover — reads as "cool dark UI" without deeper design decisions | Medium |
| **Identical card grids** | Admin dashboard stats cards (5 identical cards), ProStatsFull sections (8 identical bordered containers) | Medium |
| **Hero metrics** | Score cards with "big number / small label / /100" pattern in ProStatsFull | Low |
| **Nested cards** | Player profile: Card → Tabs → Card → bordered div → bordered div (3+ levels of nesting) | Medium |
| **Gray on color** | `#6C757D` muted text on `#E94560` accent backgrounds in similarity breakdowns | Low |
| **Glassmorphism tokens** | `GLASS_TOKENS` and `SHADOWS.glowCyan/glowMagenta` exist in design-tokens.ts but appear unused in audited components | Low |

**What saves it:** The color system is intentionally constrained to the LeagueScout brand (`#0f1117`, `#1A1D29`, `#E94560`, `#E9ECEF`, `#6C757D`, `#2A2D3A`). The layout avoids gradient text and bounce easing. The esports context justifies some of the bold color choices.

---

## Executive Summary

| Severity | Count | Categories |
|----------|-------|------------|
| **Critical** | 3 | Accessibility, Theming |
| **High** | 7 | Accessibility, Performance, Theming, Responsive |
| **Medium** | 10 | Accessibility, Performance, Theming, Responsive |
| **Low** | 8 | Theming, Responsive, Polish |
| **Total** | **28** | |

### Most Critical Issues (Top 5)
1. **Hard-coded hex colors everywhere** — 200+ instances across 8 files, completely bypassing Tailwind v4 design tokens and shadcn/ui theming system
2. **Missing keyboard navigation on custom buttons** — SimilaritySearch uses 10+ raw `<button>` elements without focus indicators; RoleRadar/RolePercentiles toggle buttons lack focus styles
3. **No focus management in search dropdowns** — Header search and SimilaritySearch dropdowns trap keyboard users; Escape works but arrow navigation doesn't
4. **Chart.js radar chart not accessible** — No aria-label, no fallback text, no keyboard interaction, screen readers get nothing
5. **Admin page loads all players on mount** — `fetchPlayers()` and `fetchReports()` called unconditionally in `useEffect`, causing unnecessary API load

### Overall Quality Score
| Dimension | Score | Notes |
|-----------|-------|-------|
| Accessibility | **D+** | Skip link present, but keyboard nav, ARIA, and contrast issues pervasive |
| Performance | **C** | No memoization on heavy components, unnecessary re-renders likely |
| Theming | **D** | Hard-coded colors defeat the entire design token system |
| Responsive | **B** | Mobile breakpoints present, but touch targets and table overflow issues |
| Anti-patterns | **C+** | Some AI tells, but contextually appropriate for esports SaaS |
| **Overall** | **C** | Functional but needs systematic cleanup |

---

## Detailed Findings by Severity

### Critical Issues

#### CRIT-1: Hard-coded hex colors bypass entire theming system
- **Location:** All 8 audited files (200+ instances)
- **Severity:** Critical
- **Category:** Theming
- **Description:** Every component uses literal hex colors like `text-[#E9ECEF]`, `bg-[#141621]`, `border-[#2A2D3A]` instead of Tailwind v4 theme tokens (`text-foreground`, `bg-card`, `border-border`) or the custom scout tokens defined in `globals.css` (`--color-scout-primary`, etc.).
- **Impact:** Dark/light mode switching is broken in practice. The `dark:` prefixes are inconsistently applied (some components have them, some don't). The shadcn/ui theming system is completely ignored. Any theme change requires find-and-replace across 50+ files.
- **WCAG/Standard:** N/A (maintenance/architecture)
- **Recommendation:** Migrate all colors to design tokens. Use `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-muted`. Define custom tokens in `@theme inline` for brand colors (`--color-scout-accent: #E94560`).
- **Suggested command:** `/normalize`

#### CRIT-2: Raw `<button>` elements throughout SimilaritySearch lack accessibility
- **Location:** `src/app/similarity/SimilaritySearch.tsx`, lines 132, 196, 219, 229, 244, 271, 299, 366
- **Severity:** Critical
- **Category:** Accessibility
- **Description:** 8+ raw `<button>` elements used instead of the project's shadcn/ui `<Button>` component. None have `focus-visible` styles, `aria-pressed` for toggle states, or `aria-expanded` for the breakdown accordion. The scope toggle buttons ("By Scope" / "Specific Player") don't indicate selected state to screen readers.
- **Impact:** Screen reader users cannot determine which scope is selected. Keyboard users get no focus indicator on these buttons. Toggle state is invisible to assistive tech.
- **WCAG/Standard:** WCAG 2.1 A — 4.1.2 Name, Role, Value
- **Recommendation:** Replace all raw `<button>` with shadcn/ui `<Button>` (which has built-in focus-visible styles). Add `aria-pressed={mode === "scope"}` to toggles. Add `aria-expanded={expandedBreakdown === result.player.id}` to breakdown toggles.
- **Suggested command:** `/harden`

#### CRIT-3: Player Profile page has no heading hierarchy
- **Location:** `src/app/players/[id]/page.tsx`
- **Severity:** Critical
- **Category:** Accessibility
- **Description:** The page has an `<h1>` for the player name, but all section headers inside tabs use `<span>` or `<h3>` without logical nesting. The "SoloQ Accounts" header is an `<h3>` but there's no `<h2>`. Timeline event titles use `<h4>` without parent `<h3>`.
- **Impact:** Screen reader users cannot navigate by heading. The document outline is flat and confusing.
- **WCAG/Standard:** WCAG 2.1 A — 1.3.1 Info and Relationships
- **Recommendation:** Establish proper heading hierarchy: h1 (player name) → h2 (tab panel titles) → h3 (section headers). Use semantic headings, not styled spans.
- **Suggested command:** `/harden`

---

### High-Severity Issues

#### HIGH-1: Search dropdowns trap keyboard users
- **Location:** `src/components/layout/header.tsx` (SearchDropdown), `src/app/similarity/SimilaritySearch.tsx` (results dropdowns)
- **Severity:** High
- **Category:** Accessibility
- **Description:** The search dropdowns in header and similarity page open on focus/type but only support mouse interaction. Arrow keys don't navigate suggestions. Tab moves to the next element instead of into the dropdown. The `handleKeyDown` in header only handles Enter and Escape.
- **Impact:** Keyboard-only users cannot select search suggestions. They must type the full query and press Enter, missing the autocomplete feature entirely.
- **WCAG/Standard:** WCAG 2.1 A — 2.1.1 Keyboard
- **Recommendation:** Implement arrow key navigation (↓/↑ to move, Enter to select, Escape to close). Use `roving tabindex` pattern or a combobox ARIA pattern. Consider using cmdk or a similar accessible combobox library.
- **Suggested command:** `/harden`

#### HIGH-2: RadarChart has zero accessibility
- **Location:** `src/app/players/[id]/RadarChart.tsx`
- **Severity:** High
- **Category:** Accessibility
- **Description:** The Chart.js canvas has no `aria-label`, no `role="img"`, no fallback table of data. The canvas is invisible to screen readers. The tier color legend (S/A/B/C/D) is purely visual with no text alternative for the data values.
- **Impact:** Screen reader users get absolutely no information from the radar chart — one of the core value propositions of the app.
- **WCAG/Standard:** WCAG 2.1 A — 1.1.1 Non-text Content
- **Recommendation:** Add `role="img"` and `aria-label` describing the chart summary. Provide a visually-hidden data table with the metric values and tiers. Use Chart.js a11y plugin or render an HTML fallback.
- **Suggested command:** `/harden`

#### HIGH-3: RoleRadar and RolePercentiles toggle buttons lack focus indicators
- **Location:** `src/app/players/[id]/RoleRadar.tsx` lines 82-103, `src/app/players/[id]/RolePercentiles.tsx` lines 172-193
- **Severity:** High
- **Category:** Accessibility
- **Description:** The "League" / "Tier" toggle buttons in both components are raw `<button>` elements with custom styling but no `focus-visible` ring. The active state is only communicated via background color change.
- **Impact:** Keyboard users cannot see which toggle button is focused. The active state is invisible to screen readers.
- **WCAG/Standard:** WCAG 2.1 AA — 2.4.7 Focus Visible
- **Recommendation:** Add `focus-visible:ring-2 focus-visible:ring-ring` to all toggle buttons. Add `aria-pressed` to indicate selected state.
- **Suggested command:** `/harden`

#### HIGH-4: Admin dashboard stats computed on every render
- **Location:** `src/app/admin/page.tsx`, lines 398-434
- **Severity:** High
- **Category:** Performance
- **Description:** The 5 stat cards filter the entire `players` array on every render: `players.filter((p) => p.status === "FREE_AGENT").length`, `players.filter((p) => p.league === "LEC").length`, etc. With 1000+ players, this is O(n) × 5 on every state change.
- **Impact:** Unnecessary CPU usage on every keystroke, tab switch, or dialog open in the admin panel.
- **WCAG/Standard:** N/A
- **Recommendation:** Use `useMemo` for derived stats. Or better, compute these in the API response and return them as metadata.
- **Suggested command:** `/optimize`

#### HIGH-5: Admin page fetches all data unconditionally on mount
- **Location:** `src/app/admin/page.tsx`, lines 149-152
- **Severity:** High
- **Category:** Performance
- **Description:** `useEffect` calls `fetchPlayers()` and `fetchReports()` unconditionally. The admin page has 7 tabs but loads all data upfront. The Players tab is paginated (10/page) but the reports tab also loads 10/page — yet the stats cards use the in-memory `players` array, not the paginated subset.
- **Impact:** Unnecessary API calls and memory usage. The stats cards show `players.length` (max 10 due to pagination) which is misleading — it shows "10 Total Players" when there may be 500.
- **WCAG/Standard:** N/A
- **Recommendation:** Either remove pagination from the stats calculation or fetch a separate stats endpoint. Use tab-conditional data loading (load reports only when Reports tab is active).
- **Suggested command:** `/optimize`

#### HIGH-6: Footer social links lack accessible names in some contexts
- **Location:** `src/components/layout/footer.tsx`, lines 39-73
- **Severity:** High
- **Category:** Accessibility
- **Description:** Social links have `aria-label` attributes (good), but the SVG icons inside have no `aria-hidden="true"`. The SVG paths are not semantic and could be read by some screen readers.
- **Impact:** Potential double-reading or confusing output for screen readers.
- **WCAG/Standard:** WCAG 2.1 A — 1.1.1 Non-text Content
- **Recommendation:** Add `aria-hidden="true"` to all SVG icons inside links that already have `aria-label`.
- **Suggested command:** `/harden`

#### HIGH-7: MatchHistory table lacks row headers and scope
- **Location:** `src/app/players/[id]/MatchHistory.tsx`
- **Severity:** High
- **Category:** Accessibility
- **Description:** The match history table uses `<th>` in thead but data cells have no `scope` attributes. The champion name cell is a `<td>` not a `<th>`, so screen readers don't announce it as the row header.
- **Impact:** Screen reader users navigating tables hear data without context of which champion/match it belongs to.
- **WCAG/Standard:** WCAG 2.1 A — 1.3.1 Info and Relationships
- **Recommendation:** Add `scope="col"` to header cells. Consider making the champion name cell a `<th scope="row">`.
- **Suggested command:** `/harden`

---

### Medium-Severity Issues

#### MED-1: Player Profile tabs overflow horizontally on mobile
- **Location:** `src/app/players/[id]/page.tsx`, lines 331-350
- **Severity:** Medium
- **Category:** Responsive
- **Description:** The TabsList contains 11 tabs (Stats, Radar, Percentiles, SoloQ, Pro Matches, Champions, History, Similar, Timeline, Reports, VODs). On mobile (<640px), this overflows the viewport with no scroll indication.
- **Impact:** Users cannot see or access tabs that overflow the screen. No horizontal scroll is provided.
- **WCAG/Standard:** WCAG 2.1 AA — 1.4.10 Reflow
- **Recommendation:** Add `overflow-x-auto` to TabsList with `scrollbar-hide` or convert to a dropdown/select on mobile. Prioritize tabs — maybe group secondary tabs under "More".
- **Suggested command:** `/adapt`

#### MED-2: SimilaritySearch result cards use `onClick` on divs
- **Location:** `src/app/similarity/SimilaritySearch.tsx`, line 334
- **Severity:** Medium
- **Category:** Accessibility
- **Description:** The similarity result card has `onClick={() => router.push(...)}` on a `<div>`. This is not keyboard-focusable and not announced as a link to screen readers. The nested expand button uses `e.stopPropagation()` which is a code smell.
- **Impact:** Keyboard and screen reader users cannot navigate to player profiles from similarity results.
- **WCAG/Standard:** WCAG 2.1 A — 2.1.1 Keyboard, 4.1.2 Name, Role, Value
- **Recommendation:** Wrap the card in a `<Link>` component or use a real `<button>` / `<a>` element. Remove the div-onClick anti-pattern.
- **Suggested command:** `/harden`

#### MED-3: ProStatsFull ScoreCard and StatRow not memoized
- **Location:** `src/app/players/[id]/ProStatsFull.tsx`
- **Severity:** Medium
- **Category:** Performance
- **Description:** `ScoreCard` and `StatRow` are pure presentational components that re-render whenever the parent re-renders, even though their props don't change. With 50+ stat rows across 8 sections, this adds up.
- **Impact:** Unnecessary React re-render cycles when parent state changes (e.g., tab switching in the profile page).
- **WCAG/Standard:** N/A
- **Recommendation:** Wrap `ScoreCard`, `StatRow`, and `StatSection` with `React.memo()`.
- **Suggested command:** `/optimize`

#### MED-4: Header UserDropdown uses `useEffect` for click-outside on every render
- **Location:** `src/components/layout/header.tsx`, lines 223-236
- **Severity:** Medium
- **Category:** Performance
- **Description:** The click-outside handler is registered/unregistered in `useEffect` that runs whenever `open` changes. This is correct but the `handleClickOutside` function is recreated on every render and could be memoized with `useCallback`.
- **Impact:** Minor — event listener churn on dropdown toggle.
- **WCAG/Standard:** N/A
- **Recommendation:** Wrap `handleClickOutside` in `useCallback` with `[open]` dependency.
- **Suggested command:** `/optimize`

#### MED-5: ThemeProvider defaults to light mode
- **Location:** `src/components/providers/ThemeProvider.tsx`
- **Severity:** Medium
- **Category:** Theming
- **Description:** `defaultTheme="light"` with `enableSystem={false}`. The app is clearly designed for dark mode (all the hard-coded colors are dark). Users first see a light mode flash or a mismatched light theme.
- **Impact:** First-time users see a jarring light mode that doesn't match the esports aesthetic. The dark colors in components look wrong on light backgrounds.
- **WCAG/Standard:** N/A
- **Recommendation:** Set `defaultTheme="dark"` and `enableSystem={true}` to respect OS preference. Or remove light mode support entirely if it's not maintained.
- **Suggested command:** `/normalize`

#### MED-6: `dark:text-gray-400` used inconsistently instead of `text-muted-foreground`
- **Location:** Throughout all files
- **Severity:** Medium
- **Category:** Theming
- **Description:** Many components use `dark:text-gray-400` as the muted text color, but the design token for muted foreground is `text-muted-foreground` (which maps to `#A0AEC0` in dark mode). The hard-coded `gray-400` may not match the token value.
- **Impact:** Inconsistent muted text color across the app. If the token is updated, hard-coded values won't follow.
- **WCAG/Standard:** N/A
- **Recommendation:** Replace all `dark:text-gray-400` with `text-muted-foreground`. Replace `text-[#6C757D]` with `text-muted-foreground`.
- **Suggested command:** `/normalize`

#### MED-7: RadarChart fixed height breaks on small viewports
- **Location:** `src/app/players/[id]/RadarChart.tsx`, line 155
- **Severity:** Medium
- **Category:** Responsive
- **Description:** The chart container has `style={{ height: 400 }}` with no responsive adjustment. On mobile (<400px width), a 400px tall chart dominates the screen and may cause horizontal scroll if the container has padding.
- **Impact:** Poor mobile experience. Chart labels may overlap on narrow screens.
- **WCAG/Standard:** WCAG 2.1 AA — 1.4.10 Reflow
- **Recommendation:** Use responsive height: `className="h-[300px] sm:h-[350px] md:h-[400px]"` instead of fixed inline style.
- **Suggested command:** `/adapt`

#### MED-8: Admin tables lack responsive behavior
- **Location:** `src/app/admin/page.tsx`
- **Severity:** Medium
- **Category:** Responsive
- **Description:** The players and reports tables use `overflow-x-auto` but have 8+ columns. On mobile, horizontal scrolling is required. Some columns (Links, POTM) could be hidden or collapsed on small screens.
- **Impact:** Horizontal scrolling on mobile is frustrating. Touch targets in the table may be too small.
- **WCAG/Standard:** WCAG 2.1 AA — 1.4.10 Reflow
- **Recommendation:** Hide less-critical columns on mobile (`hidden md:table-cell`). Use a card-based layout for mobile admin views.
- **Suggested command:** `/adapt`

#### MED-9: PercentileBar inline styles for colors
- **Location:** `src/app/players/[id]/RolePercentiles.tsx`, lines 55-66
- **Severity:** Medium
- **Category:** Theming
- **Description:** The percentile tier badges use inline `style={{ color, backgroundColor: \`${color}15\` }}`. These cannot be overridden by CSS themes and don't respond to dark mode changes.
- **Impact:** Colors are locked in code. No way to customize via theme.
- **WCAG/Standard:** N/A
- **Recommendation:** Map tier colors to Tailwind classes or CSS custom properties. Use `className` instead of inline `style`.
- **Suggested command:** `/normalize`

#### MED-10: Behavior tags JSON parse in JSX
- **Location:** `src/app/players/[id]/page.tsx`, lines 193-211
- **Severity:** Medium
- **Category:** Performance
- **Description:** `JSON.parse(player.behaviorTags)` is called inline during render. If `behaviorTags` is large or malformed, this can throw and crash the render. The try/catch swallows errors silently.
- **Impact:** Potential runtime errors. Silent failures hide data issues.
- **WCAG/Standard:** N/A
- **Recommendation:** Parse behavior tags in a `useMemo` hook or at the data layer (API/DB). Log parse errors instead of silently swallowing.
- **Suggested command:** `/optimize`

---

### Low-Severity Issues

#### LOW-1: `Avatar` component `size="sm"` prop doesn't exist in shadcn/ui
- **Location:** `src/components/layout/header.tsx`, line 128
- **Severity:** Low
- **Category:** Theming
- **Description:** `<Avatar size="sm">` is used but the shadcn/ui Avatar component doesn't accept a `size` prop. This prop is silently ignored.
- **Impact:** Avatar sizes may not be consistent. The fallback shows at default size.
- **Recommendation:** Use `className="h-8 w-8"` instead of `size="sm"`.
- **Suggested command:** `/normalize`

#### LOW-2: `Eye` and `EyeIcon` both imported in ProStatsFull
- **Location:** `src/app/players/[id]/ProStatsFull.tsx`, line 3
- **Severity:** Low
- **Category:** Performance
- **Description:** Both `Eye` and `EyeIcon` are imported from lucide-react. Only `EyeIcon` is used.
- **Impact:** Slightly larger bundle size. Minor code cleanliness issue.
- **Recommendation:** Remove unused `Eye` import.
- **Suggested command:** `/optimize`

#### LOW-3: Footer grid uses `md:grid-cols-4` with `md:col-span-2` for brand
- **Location:** `src/components/layout/footer.tsx`, line 24
- **Severity:** Low
- **Category:** Responsive
- **Description:** The footer grid is 4 columns on desktop but the brand takes 2 columns while links take 1 each. This leaves an empty 4th column on some screen sizes.
- **Impact:** Slightly unbalanced layout. Not a functional issue.
- **Recommendation:** Use `md:grid-cols-3` or distribute columns more evenly.
- **Suggested command:** `/arrange`

#### LOW-4: `TrendingUp` imported as `TrendingUpIcon` alias
- **Location:** `src/app/players/[id]/page.tsx`, line 69
- **Severity:** Low
- **Category:** Theming
- **Description:** `TrendingUp as TrendingUpIcon` is imported but used as `TrendingUpIcon`. This is fine but inconsistent with other imports.
- **Impact:** None functional. Minor consistency issue.
- **Recommendation:** Use consistent import naming.
- **Suggested command:** `/polish`

#### LOW-5: `getRankColor` function uses wrong fallback color
- **Location:** `src/app/players/[id]/page.tsx`, lines 10-14
- **Severity:** Low
- **Category:** Theming
- **Description:** The fallback is `text-[#1A1A2E] dark:text-white` but `#1A1A2E` is nearly invisible on the light background (`#FFFFFF`).
- **Impact:** If a rank is unmapped, the text may be unreadable in light mode.
- **Recommendation:** Use `text-muted-foreground` as fallback.
- **Suggested command:** `/normalize`

#### LOW-6: Contract expiry calculation uses `+new Date()` coercion
- **Location:** `src/app/players/[id]/page.tsx`, line 232
- **Severity:** Low
- **Category:** Performance
- **Description:** `+new Date(player.contractEndDate)` uses unary plus coercion. This is a minor anti-pattern.
- **Impact:** None functional. Code style issue.
- **Recommendation:** Use `Date.parse(player.contractEndDate)` or `new Date(player.contractEndDate).getTime()`.
- **Suggested command:** `/polish`

#### LOW-7: SimilaritySearch breakdown colors use hard-coded hexes
- **Location:** `src/app/similarity/SimilaritySearch.tsx`, lines 399-419
- **Severity:** Low
- **Category:** Theming
- **Description:** Similarity breakdown uses `#00E676`, `#FFD93D`, `#FF6B6B` for good/medium/bad — different from the tier colors used elsewhere (`#00D9C0`, `#00E676`, `#FFD93D`, `#FF9F43`, `#FF6B6B`).
- **Impact:** Inconsistent color semantics across the app.
- **Recommendation:** Use the `PERCENTILE_COLORS` or `TIER_COLORS` constants consistently.
- **Suggested command:** `/normalize`

#### LOW-8: Admin dialog edit trigger uses `<div>` inside `<DialogTrigger>`
- **Location:** `src/app/admin/page.tsx`, lines 619-626
- **Severity:** Low
- **Category:** Accessibility
- **Description:** The edit button is a `<div>` with `onClick` inside `<DialogTrigger>`. This creates a nested interactive element and may cause focus issues.
- **Impact:** Potential focus management issues with the dialog.
- **Recommendation:** Use `<Button variant="ghost" size="icon">` directly as the DialogTrigger child, or use `asChild` pattern.
- **Suggested command:** `/harden`

---

## Patterns & Systemic Issues

### 1. Hard-coded colors are EVERYWHERE
**Impact:** Critical. Every audited file uses literal hex colors (`text-[#E9ECEF]`, `bg-[#141621]`, `border-[#2A2D3A]`, etc.) instead of Tailwind v4 theme tokens. The `globals.css` defines proper tokens (`--color-background`, `--color-foreground`, `--color-card`, `--color-muted-foreground`, etc.) and the `@theme inline` block defines scout-specific tokens, but none are used in components.

**Files affected:** All 8 audited files, plus an estimated 30+ additional components based on grep results.

**Fix:** Systematic migration to tokens. Priority order:
1. `text-[#E9ECEF]` → `text-foreground`
2. `text-[#6C757D]` → `text-muted-foreground`
3. `bg-[#141621]` → `bg-card` (or custom `bg-scout-card`)
4. `bg-[#1A1F2E]` → `bg-muted`
5. `border-[#2A2D3A]` → `border-border`
6. `text-[#E94560]` → `text-scout-highlight` (custom token)

### 2. Raw `<button>` elements instead of shadcn/ui `<Button>`
**Impact:** High. Custom buttons lack focus-visible rings, disabled states, and consistent styling. Found in SimilaritySearch, RoleRadar, RolePercentiles, MatchHistory.

**Fix:** Audit all `<button>` usage and replace with `<Button variant="...">` from the design system.

### 3. Missing memoization on pure components
**Impact:** Medium. `ScoreCard`, `StatRow`, `StatSection`, `PercentileBar`, and table rows re-render unnecessarily.

**Fix:** Apply `React.memo()` to all pure presentational components.

### 4. Inconsistent dark mode support
**Impact:** High. Some components have `dark:` prefixes, others don't. The hard-coded dark colors in components like SimilaritySearch (`bg-[#141621]`, `text-[#E9ECEF]`) are always dark regardless of theme setting.

**Fix:** Either commit to dark-only (remove ThemeProvider light mode) or properly implement dual-theme support with tokens.

### 5. Tables lack responsive strategy
**Impact:** Medium. MatchHistory, ProMatchHistory, Admin tables all use `overflow-x-auto` as a band-aid. On mobile, users scroll horizontally through 8+ columns.

**Fix:** Implement column hiding (`hidden md:table-cell`), card-based mobile views, or horizontal scroll with visible scroll indicators.

---

## Positive Findings

### What's Working Well

1. **Skip-to-content link** — `layout.tsx` has a proper skip link for keyboard users. Well implemented with visible focus styles.

2. **Semantic landmarks** — `<header>`, `<main>`, `<footer>` are used correctly in layout. The profile page uses `<h1>` for the player name.

3. **OpenGraph and Twitter meta tags** — `generateMetadata` in the player page provides rich social sharing data with player photos.

4. **Server-side data fetching with caching** — `unstable_cache` is used for player data with 120s revalidation. Good Next.js 15 pattern.

5. **shadcn/ui base components are well-configured** — The `Button`, `Tabs`, `Input`, `Badge` components in `components/ui/` have proper focus-visible styles, ARIA support, and dark mode variants. The problem is that *audited pages don't use them consistently*.

6. **External links have proper security attributes** — All external links use `target="_blank" rel="noopener noreferrer"`.

7. **Loading states are consistent** — `Loader2` with `animate-spin` is used consistently across all data-fetching components.

8. **Empty states are informative** — "No reports available", "No timeline events yet", "No VODs available" — all explain what's missing.

9. **CommandPalette included in header** — Accessibility power-user feature (Cmd+K) is present.

10. **Breadcrumb navigation** — Profile page has breadcrumb for wayfinding.

---

## Recommendations by Priority

### Immediate (Fix This Week)

1. **Migrate critical colors to tokens** — Start with `text-[#E9ECEF]`, `bg-[#141621]`, `border-[#2A2D3A]` in the 8 audited files. Use find-and-replace with token equivalents.
2. **Fix SimilaritySearch button accessibility** — Replace raw `<button>` with `<Button>`, add `aria-pressed` to toggles, wrap result cards in `<Link>`.
3. **Add keyboard navigation to search dropdowns** — Implement arrow keys + Enter/Escape in header search.
4. **Fix RadarChart accessibility** — Add `role="img"`, `aria-label`, and visually-hidden data table.

### Short-Term (This Sprint)

5. **Memoize pure components** — `React.memo()` on `ScoreCard`, `StatRow`, `PercentileBar`.
6. **Fix admin data loading** — Separate stats endpoint or remove pagination for stats calculation.
7. **Add responsive tab handling** — Overflow scroll or dropdown for profile page tabs on mobile.
8. **Fix heading hierarchy** — Proper h1→h2→h3 nesting in profile page.
9. **Set default theme to dark** — `defaultTheme="dark"` in ThemeProvider.

### Medium-Term (Next Sprint)

10. **Systematic color audit** — Run a project-wide find for `text-[#`, `bg-[#`, `border-[#` and migrate to tokens.
11. **Responsive table strategy** — Column hiding, card layouts for mobile.
12. **Chart.js a11y plugin** — Install and configure for all chart components.
13. **Focus management audit** — Ensure all interactive elements have visible focus indicators.

### Long-Term (Nice-to-Haves)

14. **Remove light mode or fully support it** — Currently it's half-implemented and broken.
15. **Add prefers-reduced-motion support** — Respect user motion preferences.
16. **Implement progressive enhancement** — Core stats should be visible without JS.
17. **Add E2E a11y tests** — Use axe-core or Playwright a11y scanning in CI.

---

## Suggested Commands for Fixes

| Command | Issues Addressed | Description |
|---------|-----------------|-------------|
| `/normalize` | CRIT-1, MED-5, MED-6, LOW-1, LOW-5, LOW-7 | Migrate hard-coded colors to design tokens, fix theme inconsistencies |
| `/harden` | CRIT-2, CRIT-3, HIGH-1, HIGH-2, HIGH-3, HIGH-6, HIGH-7, MED-2, LOW-8 | Fix accessibility: keyboard nav, ARIA, focus indicators, semantic HTML |
| `/optimize` | HIGH-4, HIGH-5, MED-3, MED-4, MED-10, LOW-2 | Memoization, data loading, performance improvements |
| `/adapt` | MED-1, MED-7, MED-8, LOW-3 | Responsive design: mobile tabs, chart height, table layouts |
| `/polish` | LOW-4, LOW-6 | Code cleanup, import consistency |
| `/arrange` | LOW-3 | Footer grid layout improvement |

---

## Appendix: Color Token Mapping Reference

| Current Hard-coded | Recommended Token | Notes |
|-------------------|-------------------|-------|
| `text-[#E9ECEF]` | `text-foreground` | Primary text |
| `text-[#6C757D]` | `text-muted-foreground` | Secondary/muted text |
| `text-[#ADB5BD]` | `text-muted-foreground` | Slightly lighter muted |
| `bg-[#141621]` | `bg-card` | Card backgrounds |
| `bg-[#1A1F2E]` | `bg-muted` | Section backgrounds |
| `bg-[#1A1D29]` | `bg-popover` | Dropdown/popover backgrounds |
| `bg-[#232838]` | `bg-secondary` | Elevated element backgrounds |
| `border-[#2A2D3A]` | `border-border` | Default borders |
| `border-[#232838]` | `border-border/50` | Subtle dividers |
| `text-[#E94560]` | `text-scout-highlight` | Brand accent (add to tokens) |
| `bg-[#E94560]` | `bg-scout-highlight` | Brand accent background |
| `text-[#1A1A2E]` | `text-foreground` (light mode) | Dark text on light bg |
| `bg-[#0f172a]` | `bg-accent` | Hover/active backgrounds |

---

*Report generated by Kimi Code CLI Audit Skill. This is a documentation-only audit — no code changes were made.*
