# FlashPro Release Planner — Prime Directives

These rules apply to every change made to this codebase. Read this file before writing any code.

---

## 1. Colour Prime Directive (MANDATORY)

**All colours MUST come from `lib/design-tokens.ts`. No exceptions.**

```ts
import { colors, SPRINT_COLORS, STREAM_DEFAULT_COLORS, T } from '@/lib/design-tokens'
```

### Rules

1. **Never hardcode a hex value** (`#5B8DEF`, `rgba(...)`, `hsl(...)`) anywhere — not in JSX inline styles, CSS modules, Tailwind classes, or SVG attributes.
2. **Use the semantic token**, not the raw colour. Use `colors.danger` not `#E05E5E`. The semantic name communicates intent and makes future palette swaps automatic.
3. **Pastel data-viz colours** (Gantt bars, chart fills) are computed at runtime from the base colour using the `toPastel(hex)` utility in `page.tsx`. Never hardcode the pastel value.
4. **Sprint header colours** → `SPRINT_COLORS[sprintKey]`
5. **Stream colours** → user-configurable; use `stream.color` from state. Defaults in `STREAM_DEFAULT_COLORS`.
6. **Adding a new token**: only if the semantic meaning genuinely doesn't exist. Document it in `lib/design-tokens.ts` with a JSDoc comment explaining the usage.

### Approved tokens

| Token | Hex | Use for |
|---|---|---|
| `colors.bg` | `#FAFAFA` | Page background |
| `colors.surface` | `#FFFFFF` | Cards, modals, panels |
| `colors.surfaceHover` | `#F4F4F5` | Hover state on cards |
| `colors.border` | `#E4E4E7` | All borders and dividers |
| `colors.borderLight` | `#F4F4F5` | Subtle section separators |
| `colors.text` | `#18181B` | Primary body text |
| `colors.textSecondary` | `#52525B` | Labels, descriptions |
| `colors.textMuted` | `#A1A1AA` | Placeholders, captions |
| `colors.primary` | `#5B8DEF` | CTAs, active tabs, links |
| `colors.primaryDark` | `#3B6FD4` | Hover on primary |
| `colors.primaryLight` | `#EEF4FE` | Chip backgrounds, row tints |
| `colors.success` | `#166534` | Success text |
| `colors.successBg` | `#DCFCE7` | Success backgrounds |
| `colors.warning` | `#C2742A` | Warning text (burnt amber) |
| `colors.warningBg` | `#FEF0E0` | Warning backgrounds |
| `colors.danger` | `#E05E5E` | Error text (coral red) |
| `colors.dangerBg` | `#FFF0F0` | Error backgrounds |
| `colors.info` | `#0369A1` | Info text |
| `colors.infoBg` | `#E0F2FE` | Info backgrounds |
| `colors.accent` | `#7E22CE` | Split badge text (violet) |
| `colors.accentBg` | `#F3E8FF` | Split badge bg (lilac) |
| `colors.navBg` | `#18181B` | Top nav background |
| `colors.seller` | `#166534` | Seller persona text |
| `colors.sellerBg` | `#DCFCE7` | Seller badge background |
| `colors.operator` | `#1D4ED8` | Operator persona text |
| `colors.operatorBg` | `#DBEAFE` | Operator badge background |

### Typography, spacing, radius, shadows

Also from `lib/design-tokens.ts`:
- `typography.fs` — font sizes (xs:10, sm:12, base:13, md:14, lg:16, xl:20)
- `spacing` — (xs:4, sm:8, md:12, lg:16, xl:24, xxl:32)
- `radius` — (sm:4, md:6, lg:8, xl:12, full:9999)
- `shadows.sm/md/lg`

---

## 2. Clean Code Directives

- **No magic numbers**: every layout value must use `spacing.*` or `radius.*`.
- **No dead code**: remove `// logged` stubs, unused imports, and commented-out blocks before committing.
- **No duplication**: if the same JSX pattern appears in 3+ places, extract a component.
- **No inline type declarations** for domain objects: use types from `lib/types.ts`.
- **No hardcoded constants**: use `lib/constants.ts` (sprint keys, limits, capacities).
- **Python scripts** live in `lib/python/*.py` — never embed them as template literals.
- **useMemo** on every derived computation (`filtered`, `cpLate`, `brokenDepIds`, etc.).

---

## 3. New Feature Checklist

Before shipping any new feature:

- [ ] All colours reference `lib/design-tokens.ts` tokens
- [ ] New domain types added to `lib/types.ts`
- [ ] New constants added to `lib/constants.ts`
- [ ] ACs written in `FlashPro Release Planner Test Strategy/acceptance-criteria.md`
- [ ] API test added to `FlashPro Release Planner Test Strategy/data for testing/api-tests.sh`
- [ ] TypeScript check passes: `node_modules/.bin/tsc --noEmit`
- [ ] Production build passes: `npm run build`

---

## 4. File Structure Reference

```
app/
  page.tsx              Main board (uses T from local const — should migrate to design-tokens)
  settings/page.tsx     Settings
  api/*/route.ts        API endpoints (all marked force-dynamic)

lib/
  design-tokens.ts  ← COLOUR SOURCE OF TRUTH
  types.ts              Domain types (Story, Stream, Card, DepWarning…)
  constants.ts          App constants (SPRINT_KEYS, DEFAULT_STREAMS…)
  python/*.py           Excel import/export scripts
  dependencies.ts       Built-in STORY_DEPS
  users.ts              User auth helpers

FlashPro Release Planner Test Strategy/
  acceptance-criteria.md    All ACs (Rev 11, 641 ACs)
  data for testing/         Test Excel files + api-tests.sh
  qa-report-round-*.md      QA history
  bug-report-*.md           Bug log
```
