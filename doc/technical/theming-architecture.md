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

Receives the server UTC epoch, the compiled `DICT_TARGET`, and the runtime `localeTag`
from the SDK. Returns a `ResolvedThemeContext`.

```typescript
// src/theme/ThemeScheduler.ts

export function resolveTheme(
  utcEpoch: number,
  dictTarget: string,  // VITE_DICT_TARGET — "es" | "en" | ...
  localeTag: string    // ytgame.system.getLanguage() BCP-47 — "es-ES" | "es-419" | "en-US" ...
): ResolvedThemeContext {
  const date  = new Date(utcEpoch * 1000); // server-provided — never new Date()
  const month = date.getUTCMonth() + 1;
  const day   = date.getUTCDate();

  // ── Theme resolution ────────────────────────────────────────────────────
  let theme: Theme = defaultTheme;

  const isWinterSeason   = (month === 11 && day >= 25) || month === 12 || (month === 1 && day <= 6);
  const isHalloweenSeason = (month === 10 && day >= 15) || (month === 11 && day === 1);
  const isSummerSeason   = month >= 6 && month <= 9;

  if (isWinterSeason)                                theme = winterTheme;
  else if (isHalloweenSeason && dictTarget === "en") theme = halloweenTheme;
  else if (isSummerSeason)                           theme = summerTheme;

  // ── Badge resolution (independent of theme) ──────────────────────────
  const badges: LogoBadge[] = [];

  if (month === 12 && day === 25)                        badges.push(santaHatBadge);
  if (month === 1  && day === 1)                         badges.push(newYearBadge);
  if (month === 1  && day === 6 && dictTarget === "es")  badges.push(threeKingsBadge);
  if (month === 6  && day === 28)                        badges.push(prideBadge);
  // localeTag enables finer regional rules, e.g.:
  // if (month === 7 && day === 4 && localeTag === "en-US") badges.push(independenceDayBadge);
  // Add future badges here — one line each

  return { theme, badges };
}
```

`resolveTheme()` is called exactly once in `SplashScreen`, after
`PlatformService.initialize()` provides the UTC epoch and `getLanguage()` provides
the BCP-47 locale tag. The `ResolvedThemeContext` is stored in `ThemeProvider` for
the lifetime of the session.

---

## 7. ThemeProvider & Splash Sequencing

`ThemeProvider` applies each `theme.cssVars` entry via
`document.documentElement.style.setProperty()` on mount. It exposes
`ResolvedThemeContext` via `useTheme()`. `<PlatesLogo />` consumes `theme.logoBadge`
and `badges`, rendering the base theme badge first, then independent badges in
array order.

The Splash screen renders in two phases to avoid a flash of unstyled content:

```
Phase 1 — immediate render:
  Default CSS vars hardcoded in base.css as :root fallback values.
  Logo + spinner render instantly with default theme.

Phase 2 — after PlatformService.initialize() resolves:
  ThemeScheduler.resolveTheme(utcEpoch, dictTarget, localeTag)
  ThemeProvider applies new cssVars to :root.
  Logo re-renders with active theme and badges.
  Navigation proceeds to HOME.
```

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