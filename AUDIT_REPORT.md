# ScoutGG Interface Quality Audit

## Anti-Patterns Verdict
**PASS** — The interface does not look AI-generated. The dark esports aesthetic with the custom color palette (#E94560 accent on #0F0F1A background) is distinctive and appropriate for the target audience. No gradient text, no glassmorphism used decoratively, no generic card grids with icon+heading+text templates. The design is cohesive and purpose-built for a scouting platform.

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 3 |
| Medium | 5 |
| Low | 4 |

**Most critical issues:**
1. `<div>` used as interactive overlay without ARIA role/keyboard support (WCAG A violation)
2. 199+ hard-coded hex colors bypass the design token system
3. Heading hierarchy skips h2 on the landing page (h1 → h3)
4. 57 `console.*` calls in production code paths (build strips some but not all)

**Overall quality score: 7.5/10** — Solid foundation, mostly systemic theming issues rather than functional bugs.

**Recommended next steps:**
1. Fix the A11y critical issue (ProStatsFull.tsx overlay)
2. Audit and migrate hard-coded colors to CSS variables
3. Add proper heading hierarchy on landing page
4. Clean up remaining console.log calls

---

## Detailed Findings by Severity

### Critical Issues

#### CRIT-1: Interactive div without ARIA role or keyboard support
- **Location**: `src/app/players/[id]/ProStatsFull.tsx:266`
- **Severity**: Critical
- **Category**: Accessibility
- **Description**: `<div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />` is used as a click-to-dismiss overlay. It has no `role="button"`, no `tabIndex`, no keyboard handler.
- **Impact**: Keyboard users and screen reader users cannot close the overlay. Traps focus.
- **WCAG**: 4.1.2 Name, Role, Value (Level A)
- **Recommendation**: Replace with `<button>` styled as invisible overlay, or add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler.
- **Suggested command**: `/harden`

### High-Severity Issues

#### HIGH-1: Heading hierarchy skips h2 on landing page
- **Location**: `src/app/page.tsx:246` (h1) → `src/app/page.tsx:291` (h3)
- **Severity**: High
- **Category**: Accessibility
- **Description**: The landing page goes from `<h1>` directly to `<h3>`, skipping `<h2>`. This breaks screen reader navigation and document outline.
- **Impact**: Screen reader users rely on heading levels to navigate. Skipping levels creates confusion.
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Recommendation**: Change section headings from h3 to h2, or add an h2 between h1 and h3.
- **Suggested command**: `/harden`

#### HIGH-2: 199+ hard-coded hex colors in TSX files
- **Location**: Across 30+ files (VsDuelCard, ShareableReport, lists, draft-board, charts, etc.)
- **Severity**: High
- **Category**: Theming
- **Description**: Colors are hard-coded as hex strings (`#E94560`, `#0F3460`, `#28A745`, etc.) instead of using the CSS custom properties defined in `globals.css`.
- **Impact**: Theme switching impossible. Dark/light mode maintenance is brittle. Any color change requires editing dozens of files.
- **Recommendation**: Map all hard-coded colors to CSS variables (e.g., `--color-primary-accent`, `--color-success`). The design system already has tokens — they're just not being used consistently.
- **Suggested command**: `/normalize`

#### HIGH-3: console.log/warn/error in production code paths
- **Location**: 57 occurrences across 25+ files
- **Severity**: High
- **Category**: Performance / Robustness
- **Description**: `console.error`, `console.warn`, and `console.log` are scattered throughout API routes (Stripe webhooks), client components, and utilities. Next.js `removeConsole` strips them in production builds, but they still run during SSR/ISR and pollute server logs.
- **Impact**: Server log noise, potential information leakage in production (Stripe webhook events logged with customer IDs), missed error handling (some errors are only logged, not reported to Sentry).
- **Recommendation**: Replace all `console.*` with the existing `logger` utility (`src/lib/logger`). In production, logger is configured to be silent. For client-side errors, use `logger` or toast notifications.
- **Suggested command**: `/harden`

### Medium-Severity Issues

#### MED-1: Missing alt text on decorative images
- **Location**: `src/components/Flag.tsx`, `src/components/Avatar.tsx`
- **Severity**: Medium
- **Category**: Accessibility
- **Description**: The `Flag` component renders country flag images without `alt` text (falls back to country code). The `Avatar` component has alt text but it's sometimes generic.
- **Impact**: Screen readers announce "image" or a code instead of a meaningful description.
- **WCAG**: 1.1.1 Non-text Content (Level A)
- **Recommendation**: Add descriptive `alt` to flags (e.g., `alt="France flag"`). For avatars, ensure alt is the player name.
- **Suggested command**: `/harden`

#### MED-2: Backdrop blur used on 8+ components
- **Location**: Header, CompareBar, PlayerCard, ReportCard, ScoutingBoard, etc.
- **Severity**: Medium
- **Category**: Performance
- **Description**: `backdrop-blur` is applied to sticky/fixed elements (header, compare bar) and overlays. While functional, it triggers expensive compositing on every scroll/frame.
- **Impact**: Jank on lower-end devices, especially when combined with `position: fixed/sticky`. Can reduce frame rate.
- **Recommendation**: Use `backdrop-blur` sparingly. On the header, consider a solid semi-transparent background without blur on mobile. Test with `prefers-reduced-motion`.
- **Suggested command**: `/optimize`

#### MED-3: Form inputs without associated labels
- **Location**: `src/app/players/page.tsx:423-426` (hidden inputs OK), need to check admin forms
- **Severity**: Medium
- **Category**: Accessibility
- **Description**: Hidden inputs are fine, but some visible inputs in admin forms may lack explicit `<label>` associations.
- **Impact**: Screen readers can't identify form fields without labels.
- **WCAG**: 3.3.2 Labels or Instructions (Level A)
- **Recommendation**: Audit all `<input>` and `<select>` elements for associated `<label>` or `aria-label`.
- **Suggested command**: `/harden`

#### MED-4: Large bundle imports (recharts, jspdf)
- **Location**: `package.json` dependencies
- **Severity**: Medium
- **Category**: Performance
- **Description**: `recharts`, `jspdf`, `html-to-image`, and `chart.js` are heavy dependencies. Some are used on pages where they might not be needed (e.g., jspdf only for export).
- **Impact**: Increased initial JS bundle, slower Time to Interactive.
- **Recommendation**: Ensure these are dynamically imported (`next/dynamic`) with `ssr: false` where possible. Verify current usage.
- **Suggested command**: `/optimize`

#### MED-5: `displayRank` uses `prospectRank` which may be stale
- **Location**: `src/app/prospects/page.tsx:75`
- **Severity**: Medium
- **Category**: Data Integrity
- **Description**: `displayRank: p.prospectRank ?? i + 1` falls back to array index. If `prospectRank` is stale (not recalculated after score changes), ranks can be incorrect.
- **Impact**: Misleading ranking display for users.
- **Recommendation**: Always use `i + 1` for computed ranking, or ensure `prospectRank` is updated atomically with `prospectScore`.
- **Suggested command**: `/harden`

### Low-Severity Issues

#### LOW-1: `Info` icon imported but unused in prospects page
- **Location**: `src/app/prospects/page.tsx`
- **Severity**: Low
- **Category**: Code Quality
- **Description**: After recent UI refactoring, the `Info` import from lucide-react may be unused.
- **Recommendation**: Remove unused imports.
- **Suggested command**: Code cleanup

#### LOW-2: `max-w-*` container pattern repeated on every page
- **Location**: Every page has `mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8`
- **Severity**: Low
- **Category**: Code Quality
- **Description**: The container pattern is copy-pasted across 20+ pages.
- **Recommendation**: Extract to a `<PageContainer>` layout component.
- **Suggested command**: `/extract`

#### LOW-3: `prospectTrend` is rendered but may always be null
- **Location**: `src/app/prospects/page.tsx:242`
- **Severity**: Low
- **Category**: Data Integrity
- **Description**: `TrendIndicator` component renders based on `player.prospectTrend` but this field is rarely populated.
- **Recommendation**: Either populate `prospectTrend` or hide the column when data is missing.
- **Suggested command**: `/distill`

#### LOW-4: No `prefers-reduced-motion` handling
- **Location**: Global
- **Severity**: Low
- **Category**: Accessibility
- **Description**: Animations (spin, pulse, transitions) run regardless of user preference.
- **Impact**: Users with vestibular disorders may experience discomfort.
- **Recommendation**: Wrap animations in `@media (prefers-reduced-motion: no-preference)`.
- **Suggested command**: `/harden`

---

## Patterns & Systemic Issues

1. **Hard-coded colors in 30+ files** — The design token system exists (`globals.css`) but is inconsistently applied. Charts, canvas rendering, and utility components bypass it entirely.
2. **Console logging instead of structured logging** — The `logger` utility exists but many developers default to `console.*`. This is a team habit issue.
3. **Container pattern duplication** — Every page repeats the same max-width + padding wrapper. A single layout component would DRY this up.
4. **Missing A11y review on new components** — The FavoriteButton test failure (SessionProvider mock) suggests A11y/RTL testing isn't a gate in the dev workflow.

---

## Positive Findings

1. **Strong design system foundation** — CSS custom properties are well-defined in `globals.css`. Tailwind v4 theming is properly configured.
2. **Good loading states** — Every slow page has a `loading.tsx` with skeleton UI (14 total).
3. **Proper image optimization** — Next.js `<Image>` is used consistently with proper sizing.
4. **Dark-first approach** — The dark theme is the default and is well-executed with good contrast ratios.
5. **Test coverage** — 180 unit tests pass, including component tests with RTL. Vitest setup is solid.
6. **No AI slop tells** — The interface avoids gradient text, glassmorphism decoration, generic card grids, and hero metric layouts. It feels purpose-built.

---

## Recommendations by Priority

### Immediate (fix today)
1. Fix CRIT-1: Add ARIA role to ProStatsFull overlay div
2. Clean up 57 console.* calls → use logger utility

### Short-term (this week)
3. Fix HIGH-1: Heading hierarchy on landing page
4. Fix HIGH-2: Migrate top 20 hard-coded colors to CSS variables
5. Fix MED-5: Use computed index for prospect ranking instead of stale DB field

### Medium-term (next sprint)
6. Fix MED-1: Add alt text to Flag component
7. Fix MED-2: Reduce backdrop-blur usage on mobile
8. Fix MED-3: Audit form labels in admin
9. Fix MED-4: Verify dynamic imports for heavy deps

### Long-term
10. Extract shared PageContainer layout component (LOW-2)
11. Add `prefers-reduced-motion` support (LOW-4)
12. Set up A11y linting (eslint-plugin-jsx-a11y)

---

## Suggested Commands for Fixes

- `/harden` — Fix A11y issues (CRIT-1, HIGH-1, MED-1, MED-3, LOW-4), console cleanup
- `/normalize` — Migrate hard-coded colors to design tokens (HIGH-2)
- `/optimize` — Reduce backdrop-blur, verify dynamic imports (MED-2, MED-4)
- `/extract` — Create shared PageContainer component (LOW-2)
- `/distill` — Clean up unused imports, stale fields (LOW-1, LOW-3)
