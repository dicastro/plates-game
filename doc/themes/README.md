# Theme Catalogue

Visual reference for all implemented themes. Each theme has a standalone HTML file
that can be opened directly in a browser — no server required.

For the theming system architecture (how `ThemeScheduler`, `ThemeProvider`, CSS vars,
and badge composition work), see `doc/technical/theming-architecture.md`.

---

## Implemented Themes

| Theme ID | File | Active when | Dict target | Status |
|---|---|---|---|---|
| `cantabria-green` | [cantabria-green.html](./cantabria-green.html) | Default (fallback) | All | ✅ Defined |
| `winter` | — | Nov 25 – Jan 6 | All | 🔲 Pending |
| `halloween` | — | Oct 15 – Nov 1 | `en` only | 🔲 Pending |
| `summer` | — | Jun – Sep | All | 🔲 Pending |

---

## What each HTML file documents

Each theme file is a self-contained visual specification covering:

- **Color palette** — all CSS custom properties with hex values and usage notes
- **Typography** — heading, body, muted, and monospace rendering on theme background
- **Buttons** — primary, secondary, danger, ghost, and close variants
- **License plate component** — standard and jackpot (bonus) variants with rivets
- **Status tags** — valid, invalid, active turn, informational
- **Input field** — default and focus states
- **Splash animation** — animated logo preview (CSS only, GPU-accelerated)
- **Info overlay** — bonus explanation overlay triggered from jackpot plate

---

## Adding a new theme

1. Duplicate `cantabria-green.html` and rename it `[theme-id].html`.
2. Update all CSS custom property values at the top of the file.
3. Verify every component section renders correctly against the new palette.
4. Add a row to the table above.
5. Add the corresponding `Theme` object in `src/theme/themes/[theme-id].ts`.
6. Register the activation condition in `ThemeScheduler.resolveTheme()`.