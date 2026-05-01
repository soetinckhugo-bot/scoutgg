/**
 * ScoutGG Design System Tokens
 * 
 * Usage: Import these tokens to ensure consistency across all pages.
 * All colors, spacing, and effects used on the homepage are defined here.
 */

// ═══════════════════════════════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════════════════════════════

export const colors = {
  // Brand
  primary: "#E94560",      // Pink accent - CTAs, badges, highlights
  primaryHover: "#d13b54", // Primary hover state
  secondary: "#0F3460",    // Deep blue - links, accents, charts
  
  // Backgrounds
  bgPage: "#0F0F1A",       // Main page background
  bgCard: "#141621",       // Card surfaces
  bgCardHeader: "#1A1D29", // Card headers, hover states
  bgButton: "#1A1A2E",     // Button backgrounds (secondary)
  bgButtonHover: "#16213E", // Button hover
  bgPlaceholder: "#232838", // Avatars, skeletons
  
  // Text
  textPrimary: "#FFFFFF",
  textHeading: "#E9ECEF",   // Card titles, player names
  textBody: "#A0AEC0",      // Descriptions, subtitles
  textMuted: "#6C757D",     // Labels, metadata, captions
  textSubtle: "#ADB5BD",    // Muted labels
  
  // Borders
  border: "#2A2D3A",        // Card borders, dividers
  borderHover: "#3A3D4A",   // Hover border states
  
  // Semantic
  success: "#10B981",       // emerald-400
  successBg: "rgba(16, 185, 129, 0.2)",
  warning: "#F59E0B",       // amber/yellow
  danger: "#EF4444",        // red
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════

export const typography = {
  // Font families (defined in Tailwind config)
  heading: "font-heading",
  body: "font-sans",
  mono: "font-mono",
  
  // Sizes
  hero: "text-4xl sm:text-5xl",
  section: "text-3xl",
  subsection: "text-2xl",
  cardTitle: "text-lg",
  bodySize: "text-base",
  bodySm: "text-sm",
  caption: "text-xs",
  
  // Weights
  bold: "font-bold",
  semibold: "font-semibold",
  medium: "font-medium",
  
  // Tracking
  tight: "tracking-tight",
  wide: "tracking-wider",
  
  // Special
  tabular: "tabular-nums",
  uppercase: "uppercase",
} as const;

// ═══════════════════════════════════════════════════════════════
// SPACING
// ═══════════════════════════════════════════════════════════════

export const spacing = {
  // Section padding
  sectionY: "py-16",
  sectionX: "px-4 sm:px-6 lg:px-8",
  
  // Container
  container: "mx-auto max-w-7xl",
  containerNarrow: "mx-auto max-w-5xl",
  
  // Content gaps
  gapSm: "gap-2",
  gapMd: "gap-4",
  gapLg: "gap-6",
  gapXl: "gap-8",
  
  // Margins
  mbTitle: "mb-3",
  mbSection: "mb-6",
  mbContent: "mb-10",
  mbLarge: "mb-12",
  
  // Card padding
  cardPadding: "p-6",
  cardPaddingSm: "p-4",
  cardHeaderPadding: "px-4 py-3",
} as const;

// ═══════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════

export const layout = {
  // Grids
  grid2: "grid md:grid-cols-2 gap-6",
  grid3: "grid md:grid-cols-3 gap-6",
  grid4: "grid md:grid-cols-4 gap-6",
  gridPlayers: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4",
  gridStats: "grid grid-cols-2 md:grid-cols-4 gap-8",
  
  // Flex
  flexCenter: "flex items-center justify-center",
  flexBetween: "flex items-center justify-between",
  flexCol: "flex flex-col",
  flexColFull: "flex flex-col h-full",
} as const;

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

export const components = {
  // Cards
  card: "rounded-xl border border-border bg-card",
  cardHover: "hover:border-border-hover hover:bg-secondary transition-all duration-200",
  cardHeader: "flex items-center gap-2 px-4 py-3 bg-secondary border-b border-border",
  
  // Buttons
  btnPrimary: "inline-flex items-center justify-center px-6 py-3 text-base font-medium text-text-heading bg-primary rounded-lg hover:bg-primary/90 transition-colors",
  btnSecondary: "inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-text-heading bg-scout-primary border border-border rounded-lg hover:bg-scout-secondary hover:border-border-hover transition-all",
  btnSm: "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
  
  // Badges
  badge: "text-xs h-5 px-2 rounded-full border font-medium",
  badgeSuccess: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  badgeDefault: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  badgeContract: "bg-scout-primary text-text-subtle border-border",
  badgeWeek: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  
  // Links
  linkDark: "text-sm font-medium text-text-body hover:text-text-heading transition-colors",
  linkAccent: "text-sm text-primary hover:text-primary/90 transition-colors",
  linkLeague: "flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors",
  
  // Section
  section: "border-t border-border bg-[#0F0F1A]",
  sectionHeader: "text-center mb-10",
} as const;

// ═══════════════════════════════════════════════════════════════
// EFFECTS
// ═══════════════════════════════════════════════════════════════

export const effects = {
  // Transitions
  transitionColors: "transition-colors",
  transitionAll: "transition-all",
  transitionShadow: "transition-shadow",
  durationFast: "duration-150",
  durationNormal: "duration-200",
  
  // Hover lift
  hoverLift: "hover:-translate-y-0.5 hover:shadow-elevation-3",
  
  // Shadows
  shadowSm: "shadow-sm",
  shadowMd: "hover:shadow-md",
  
  // Gradient (hero background)
  heroGradient: "radial-gradient(circle at 25% 50%, #0F3460 0%, transparent 50%), radial-gradient(circle at 75% 50%, #E94560 0%, transparent 40%)",
} as const;

// ═══════════════════════════════════════════════════════════════
// COMBINED SHORTCUTS (most common patterns)
// ═══════════════════════════════════════════════════════════════

export const styles = {
  // Page section wrapper
  pageSection: `${spacing.sectionY} ${spacing.sectionX} ${spacing.container}`,
  
  // Standard card
  standardCard: `${components.card} ${spacing.cardPadding} flex flex-col`,
  
  // Interactive card (with hover)
  interactiveCard: `${components.card} ${components.cardHover} cursor-pointer`,
  
  // Section title
  sectionTitle: `${typography.section} ${typography.bold} ${typography.heading} text-text-heading ${spacing.mbTitle}`,
  
  // Section subtitle
  sectionSubtitle: "text-text-body",
  
  // Data label
  dataLabel: `${typography.caption} ${typography.uppercase} ${typography.wide} text-text-muted`,
  
  // Data value
  dataValue: `${typography.bodySm} ${typography.bold} ${typography.tabular} text-text-heading`,
} as const;
