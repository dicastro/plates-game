# Build Pipeline & Deployment

## 1. Target

A static frontend bundle deployed to Cloudflare Pages, served from a custom domain per
language build (see `doc/technical/worker-architecture.md` §3 for the multi-language model).
The Worker is built and deployed independently — see that same document, §1.

## 2. Modes

| Mode | Command | Platform | Obfuscation | Talks to real backend |
|---|---|---|---|---|
| `development` | `npm run dev` | MEMORY | ❌ | ❌ |
| `cf-staging` | `npm run dev:cf:stg` | CLOUDFLARE (staging environment) | ❌ | ✅ — isolated `staging` data |
| `production` | `npm run build` | CLOUDFLARE (production environment) | ✅ | ✅ — real player data |

## 3. Pipeline Stages (`npm run build`)

1. **TypeScript compilation** — `tsc -b` enforces strict typing across `tsconfig.app.json`
   and `tsconfig.node.json`.
2. **Vite bundle** — tree-shaken output to `/dist`. Source maps disabled
   (`sourcemap: false`).
3. **Obfuscation** — `rollup-obfuscator` (wraps `javascript-obfuscator`) applied to the
   production bundle, maximizing the effort required from a casual curious party or anyone
   attempting to copy the game wholesale. No `window`-bound entry points need to survive
   intact (there is no external SDK contract to preserve), so `renameGlobals` is enabled
   along with the rest of the transform set.
4. **Deployment** — `/dist` is deployed to Cloudflare Pages.

## 4. Obfuscation Configuration

| Option | Value | Rationale |
|---|---|---|
| `controlFlowFlattening` | `true` (threshold 0.75) | Defeats static analysis. |
| `deadCodeInjection` | `true` (threshold 0.4) | Misleads reverse engineers. |
| `stringArray` | `true` (threshold 0.75) | Hides all string literals. |
| `stringArrayEncoding` | `["base64"]` | Encodes strings at compile time. |
| `splitStrings` | `true` (chunkLength 5) | Fragments long strings. |
| `renameGlobals` | `true` | Safe to enable — there is no external entry point contract this would break. |

This raises the cost of casual inspection/copying; it is not a security boundary in itself —
the dictionary, scoring, and attempt counting never reach the client regardless of how well
the bundle is obfuscated (see `doc/technical/security-anticheat.md`).

## 5. Dev-Only Environment Variable Guards

Any environment variable that is safe in development but dangerous if accidentally shipped
to production gets a **build-time guard** in `vite.config.ts` (via `loadEnv()`), not just a
documentation warning — the build fails loudly rather than relying on developer discipline.

| Variable | Dangerous value | Guarded in |
|---|---|---|
| `VITE_TIME_STRATEGY` | `FAST_FORWARD` | `production` |
| `VITE_SPLASH_FORCED_DELAY_MS` | any value `> 0` | `production` |
| `ALLOWED_ORIGINS` (Worker, per-env) | CORS allow-list for the frontend origin. |
| `FRONTEND_BASE_URL` (Worker, per-env) | Where OAuth callback redirects after login — the frontend's own origin, never the Worker's. |

When adding a new dev-only env var, add a matching guard following this same pattern.

## 6. PWA Installability

`public/manifest.webmanifest` declares the app as installable:
- `display: "fullscreen"` — hides browser UI (address bar, tab strip) on install.
- `orientation: "any"` — the viewport gate (`useViewportSupport`) handles orientation
  enforcement at runtime; the manifest does not restrict it.
- Icons: `public/icon-192.png` and `public/icon-512.png` (raster, a deliberate
  exception to the Zero-Raster Policy — the Web App Manifest spec requires PNG icons;
  inline SVG is not accepted by browser install prompts).

`public/sw.js` registers a minimal app-shell cache:
- Caches only `/`, `/index.html`, and `/manifest.webmanifest` on install.
- On navigation fetch failure (offline), serves the cached `index.html` as a fallback
  so the app shell loads and can display an offline message.
- Does **not** cache game data, Worker responses, or any dynamic content — gameplay
  requires a live connection per `security-anticheat.md`.
- Only registered in production builds (`import.meta.env.PROD` guard in `main.tsx`) —
  avoids HMR interference in development.

Note: Service Worker registration requires a secure context (HTTPS or `localhost`).
LAN testing over plain HTTP requires enabling
`chrome://flags/#unsafely-treat-insecure-origin-as-secure` on the test device.
See `CONTRIBUTING.md` for local development setup.