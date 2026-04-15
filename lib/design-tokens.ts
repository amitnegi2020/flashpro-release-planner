/**
 * FlashPro Release Planner — Design Tokens (Option C: Pastel Soft)
 *
 * PRIME DIRECTIVE
 * ══════════════════════════════════════════════════════════════════════
 * Every colour used anywhere in this application MUST come from this
 * file. No hex value, rgba(), or CSS colour keyword may be hardcoded
 * in any component, page, route, or style block.
 *
 * Rules:
 *  1. Import tokens from this file: `import { colors, ... } from '@/lib/design-tokens'`
 *  2. Never hardcode a colour directly in JSX, CSS-in-JS, or inline styles.
 *  3. When building a new feature, pick the semantically correct token.
 *     Do NOT add a new token unless the semantic meaning genuinely does
 *     not exist yet — get approval first.
 *  4. All new tokens must be added HERE and documented with their usage.
 *  5. Sprint and stream colours come from SPRINT_COLORS and STREAM_COLORS.
 *     Do not invent ad-hoc colours for charts, Gantt bars, or badges.
 *  6. Pastel variants for data visualisation (Gantt bars, charts) are
 *     computed at runtime from the base colour via the `toPastel(hex)`
 *     utility in page.tsx — never hardcode the pastel value.
 * ══════════════════════════════════════════════════════════════════════
 */

// ── Base Palette ────────────────────────────────────────────────────────────

export const colors = {

  // ── Backgrounds ──────────────────────────────────────────────────────────
  /** Page-level background. Zinc 50. */
  bg:             '#FAFAFA',
  /** Card, panel, and modal surface. Pure white. */
  surface:        '#FFFFFF',
  /** Card surface on hover. Zinc 100. */
  surfaceHover:   '#F4F4F5',

  // ── Borders ───────────────────────────────────────────────────────────────
  /** Default border for inputs, cards, dividers. Zinc 200. */
  border:         '#E4E4E7',
  /** Subtle background divider — use between sections, not as outline. Zinc 100. */
  borderLight:    '#F4F4F5',

  // ── Text ──────────────────────────────────────────────────────────────────
  /** High-contrast primary text. Zinc 900. */
  text:           '#18181B',
  /** Secondary labels, descriptions. Zinc 600. */
  textSecondary:  '#52525B',
  /** Placeholders, captions, metadata. Zinc 400. */
  textMuted:      '#A1A1AA',

  // ── Primary Brand ─────────────────────────────────────────────────────────
  /** Primary action colour — buttons, active tabs, links. Cornflower. */
  primary:        '#5B8DEF',
  /** Hover/pressed state for primary. Deeper cornflower. */
  primaryDark:    '#3B6FD4',
  /** Very light primary tint — chip backgrounds, row highlights. */
  primaryLight:   '#EEF4FE',

  // ── Semantic: Success ─────────────────────────────────────────────────────
  /** Dark sage text — use on successBg or white. */
  success:        '#166534',
  /** Pastel mint background — success states, "all planned" indicator. */
  successBg:      '#DCFCE7',

  // ── Semantic: Warning / Orange ────────────────────────────────────────────
  /** Burnt amber text — over-capacity, warning badges. Complements terracotta. */
  warning:        '#C2742A',
  /** Warm peach background — warning states. */
  warningBg:      '#FEF0E0',

  // ── Semantic: Danger / Red ────────────────────────────────────────────────
  /** Coral red text — broken dependencies, errors, destructive actions.
   *  Warm coral (not harsh primary red) to complement dusty rose & terracotta. */
  danger:         '#E05E5E',
  /** Blush background — error states, danger badges. */
  dangerBg:       '#FFF0F0',

  // ── Semantic: Info ────────────────────────────────────────────────────────
  /** Dark sky text — informational states. */
  info:           '#0369A1',
  /** Pastel sky background — info chips, tooltips. */
  infoBg:         '#E0F2FE',

  // ── Accent (Split cards, partial states) ──────────────────────────────────
  /** Violet text — split story badges, part indicators. */
  accent:         '#7E22CE',
  /** Pastel lilac background — split badge pill. */
  accentBg:       '#F3E8FF',

  // ── Navigation ────────────────────────────────────────────────────────────
  /** Top nav bar background. Zinc 900 — dark for contrast. */
  navBg:          '#18181B',

  // ── Persona Colours ───────────────────────────────────────────────────────
  /** Seller text colour (on sellerBg). Dark sage. */
  seller:         '#166534',
  /** Seller badge / pill background. Pastel mint. */
  sellerBg:       '#DCFCE7',
  /** Operator text colour (on operatorBg). Rich cornflower. */
  operator:       '#1D4ED8',
  /** Operator badge / pill background. Pastel sky. */
  operatorBg:     '#DBEAFE',

} as const

// ── Sprint Header Colours ────────────────────────────────────────────────────
// Used for sprint column header backgrounds.
// All at medium saturation — readable with white text.
// Sequence graduates: Cornflower → Violet → Mauve → Dusty Rose →
//                     Terracotta → Sage → Steel Blue
export const SPRINT_COLORS: Record<string, string> = {
  sprint1:  '#5B8DEF',  // Cornflower
  sprint2:  '#7C6ED4',  // Soft violet
  sprint3:  '#9B59C4',  // Muted purple
  sprint4:  '#B06AB3',  // Soft mauve
  sprint5:  '#C0637A',  // Dusty rose
  sprint6:  '#D4845A',  // Terracotta
  sprint7:  '#5BA68C',  // Sage teal
  sprint8:  '#4A94B5',  // Steel blue
  sprint9:  '#6B8EC4',  // Periwinkle
  sprint10: '#8D7EC8',  // Lavender
  sprint11: '#5DA08A',  // Sea green
  sprint12: '#4A8FAF',  // Dusty teal
}

// ── Stream Default Colours ────────────────────────────────────────────────────
// Default colours for streams 1–8 when a project is first created.
// Users can override these in Settings → Board Setup.
export const STREAM_DEFAULT_COLORS: Record<string, string> = {
  s1: '#5B8DEF',  // Cornflower
  s2: '#5BA68C',  // Sage
  s3: '#B06AB3',  // Mauve
  s4: '#D4845A',  // Terracotta
  s5: '#C0637A',  // Dusty rose
  s6: '#4A94B5',  // Steel blue
  s7: '#9B59C4',  // Muted purple
  s8: '#5DA08A',  // Sea green
}

// ── Typography ────────────────────────────────────────────────────────────────
export const typography = {
  fontFamily:  "'Inter', system-ui, -apple-system, sans-serif",
  fontMono:    "'JetBrains Mono', 'SF Mono', monospace",
  /** Font size scale in px */
  fs: { xs: 10, sm: 12, base: 13, md: 14, lg: 16, xl: 20 } as const,
} as const

// ── Spacing ───────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
} as const

// ── Border Radius ─────────────────────────────────────────────────────────────
export const radius = {
  sm: 4, md: 6, lg: 8, xl: 12, full: 9999,
} as const

// ── Shadows ───────────────────────────────────────────────────────────────────
export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.06)',
  md: '0 2px 8px rgba(0,0,0,0.07)',
  lg: '0 8px 24px rgba(0,0,0,0.09)',
} as const

// ── Convenience re-export ─────────────────────────────────────────────────────
// Matches the shape of the T constant in page.tsx for easy migration.
export const T = {
  ...colors,
  secondary: colors.navBg,
  fontFamily: typography.fontFamily,
  fontMono:   typography.fontMono,
  fs:         typography.fs,
  sp:         spacing,
  radius,
  shadow:     shadows,
} as const
