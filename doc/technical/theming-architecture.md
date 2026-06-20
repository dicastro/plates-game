# Theming Architecture

## 1. Principles

- Themes are **developer-controlled**. Users have no theming controls.
- A **Theme** defines the complete visual identity: colors, typography tokens, and an
  optional base logo decoration.
- A **Badge** is an independent, lightweight logo overlay applied on top of any active
  theme without modifying it. A Pride flag ribbon, a New Year star, Three Kings crowns
  — these are badges, not themes.
- Theme and Badge resolution are **locale-aware**: `VITE_DICT_TARGET` (build-time) and
  the BCP-47 `localeTag` from `ytgame.system.getLanguage()` (runtime) are both available
  to the scheduler, enabling locale-specific and region-specific seasonal calendars.
- Zero redeployments required for seasonal changes. All schedules are compiled into the
  bundle and evaluated at runtime against the server-provided UTC epoch.

---

## 2. Dict Target

`VITE_DICT_TARGET` is set at build time and controls:

| Concern | Example |
|---|---|
| Dictionary CDN endpoint | `dict-es.json` vs `dict-en.json` |
| Theme/Badge schedule | locale-specific calendar branches |
| App metadata | title and description for YouTube Studio |

The YouTube leaderboard is **not configured by the client**. Each ZIP registered as a
separate Playable (`plates-es`, `plates-en`…) has its own isolated leaderboard managed
entirely by YouTube. `ytgame.engagement.sendScore({ value: N })` takes no leaderboard
parameter — YouTube resolves the target from the registered game identity.

The `CLOUDFLARE` platform target, used for the public demo URL, implements its own
ranking independently — see `doc/technical/platform-strategy.md`.

```typescript
// src/config/locale.ts — generated at build time
export const DICT_TARGET = import.meta.env.VITE_DICT_TARGET as string; // "es" | "en" | ...
```

---

## 3. Type System

```typescript
// src/theme/types.ts

/** Full visual identity: colors + optional base logo decoration */
export interface Theme {
  id: string;
  cssVars: Record<string, string>; // CSS custom property name → value
  logoBadge?: LogoBadge;           // base decoration bundled with the theme, if any
}

/**
 * Lightweight logo overlay, independent of the active theme.
 * Applied on top of whatever theme is currently active.
 * Multiple badges can be active simultaneously (rendered in array order).
 */
export interface LogoBadge {
  id: string;
  /** Inline SVG elements injected inside <PlatesLogo />. Zero raster assets. */
  decoration: React.ReactNode;
}

/** Resolved output of ThemeScheduler — what ThemeProvider consumes */
export interface ResolvedThemeContext {
  theme: Theme;
  badges: LogoBadge[]; // active independent badges (0–N)
}
```

---

## 4. CSS Variables Contract

All color, radius, and shadow tokens are CSS custom properties on `:root`.
Tailwind's `theme.extend` maps these to utility classes. Every theme must define
the full set — no partial overrides.

```css
/* Injected by ThemeProvider at runtime */
:root {
  --color-bg:           #0f172a;
  --color-surface:      #1e293b;
  --color-accent:       #f59e0b;
  --color-accent-hover: #fbbf24;
  --color-text:         #f8fafc;
  --color-text-muted:   #94a3b8;
  --color-border:       #334155;
  --color-danger:       #ef4444;
  --color-success:      #22c55e;
}
```

---

## 5. File Structure

```
src/theme/
├── types.ts
├── ThemeScheduler.ts
├── ThemeProvider.tsx
├── useTheme.ts
├── themes/
│   ├── default.ts
│   ├── winter.ts        ← full winter palette + optional base decoration
│   ├── halloween.ts     ← VITE_DICT_TARGET=en only
│   └── summer.ts
└── badges/
    ├── santaHat.tsx     ← 25 Dec (all dict targets with winter theme)
    ├── threeKings.tsx   ← 6 Jan (VITE_DICT_TARGET=es only)
    ├── pride.tsx        ← 28 Jun (all dict targets)
    └── newYear.tsx      ← 1 Jan (all dict targets)
```

Each theme file exports a `Theme`. Each badge file exports a `LogoBadge`.
Adding a new badge = one file + one entry in `ThemeScheduler`. No theme change needed.

---

## 6. ThemeScheduler

`ThemeScheduler` is a plain class receiving a `TimeService` via constructor injection —
testable, no hidden global state. Its `resolve()` method reads the cosmetic date from
`TimeService.getCosmeticDate()` (local, synchronous, zero network) and returns a
`ResolvedThemeContext`.

`ThemeScheduler` never receives a server epoch and never awaits anything — theme/badge
resolution is purely cosmetic and intentionally decoupled from the authoritative game-time
source used for anti-cheat (see `doc/technical/security-anticheat.md`). Date source:
`TimeService.getCosmeticDate()` — see `doc/technical/time-service.md`.

## 7. ThemeProvider & Splash Sequencing

`ThemeProvider` resolves the theme synchronously on mount, before first paint, and applies
`theme.cssVars` in a way that guarantees zero flash of unstyled content. There is no
two-phase render — theme resolution has no network dependency, so it completes before
Splash ever renders its first frame.

`<PlatesLogo />` and `<SplashAnimation />` consume the resolved theme and badges via
`useTheme()`.

---

## 8. Developer Checklists

**Adding a new Theme:**
1. Create `src/theme/themes/XX.ts` implementing `Theme` with the full `cssVars` set.
2. Add a date/locale condition in `ThemeScheduler` under theme resolution.
3. Optional: include a `logoBadge` for a persistent base decoration within that theme.

**Adding a new Badge:**
1. Create `src/theme/badges/XX.tsx` implementing `LogoBadge` (inline SVG, zero raster).
2. Add a date/locale condition in `ThemeScheduler` under badge resolution.
3. No theme change, no CSS vars, no other files touched.

---

## 9. Theme Visual Catalogue

Each implemented theme has a standalone HTML reference file in `doc/themes/`.
These files render all UI components (palette, typography, buttons, plates, tags,
inputs, splash animation, overlay) against the theme's actual colors and can be
opened directly in any browser without a server.

See `doc/themes/README.md` for the full catalogue index and instructions for
adding new themes.