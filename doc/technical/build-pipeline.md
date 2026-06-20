# Build Pipeline & Deployment

## 1. Target

A single self-contained flat directory zipped as `plates-game.zip`, containing `index.html` and all assets, safely under YouTube's bundle size cap (target: < 2MB, hard limit: 5–10MB).

## 2. Modes

Four explicit modes cover all development and deployment scenarios:

| Mode | Command | Platform | SDK | Obfuscation | ZIP |
|---|---|---|---|---|---|
| `dev` | `npm run dev` | MEMORY | ❌ | ❌ | ❌ |
| `yt-local` | `npm run dev:yt` | YOUTUBE | ✅ | ❌ | ❌ |
| `demo` | `npm run build:demo` | CLOUDFLARE | ❌ | ✅ | ❌ |
| `yt-zip` | `npm run build:yt` | YOUTUBE | ✅ | ✅ | ✅ |

## 3. Pipeline Stages (`npm run build:yt`)

1. **TypeScript compilation** — `tsc -b` enforces strict typing across `tsconfig.app.json` and `tsconfig.node.json`.
2. **Vite bundle** — tree-shaken ES2020 output to `/dist`. Source maps disabled (`sourcemap: false`).
3. **SDK injection** — `YT_SDK_PLUGIN` injects `<script src="https://www.youtube.com/game_api/v1">` as the first tag in `<head>` via `transformIndexHtml`.
4. **Obfuscation** — `rollup-obfuscator` (wraps `javascript-obfuscator`) applied in `demo` and `yt-zip` modes.
5. **ZIP packaging** — `vite-plugin-zip-pack` compresses `/dist` → `dist-zip/plates-game.zip` in `yt-zip` mode only.

## 4. SDK Injection Strategy

The YouTube SDK script tag is injected by `YT_SDK_PLUGIN` in `vite.config.ts` for `yt-local`
and `yt-zip` modes only. It is absent from `index.html` and from `dev`/`demo` builds.

In `main.tsx`, a `waitForYtGame()` poll detects the SDK script tag in the DOM and waits up
to 3 seconds for `window.ytgame` to be populated before mounting React. This guards against
the network redirect latency of `game_api/v1` causing the module bundle to execute before
the SDK finishes loading.

## 5. Obfuscation Configuration

| Option | Value | Rationale |
|---|---|---|
| `controlFlowFlattening` | `true` (threshold 0.75) | Defeats static analysis |
| `deadCodeInjection` | `true` (threshold 0.4) | Misleads reverse engineers |
| `stringArray` | `true` (threshold 0.75) | Hides all string literals |
| `stringArrayEncoding` | `["base64"]` | Encodes strings at compile time |
| `splitStrings` | `true` (chunkLength 5) | Fragments salts and long strings |
| `renameGlobals` | **`false`** | **CRITICAL — preserves `window.ytgame` entry points** |

## 6. YouTube Test Suite Validation

| Command | Purpose |
|---|---|
| `npm run dev:yt` | Validates SDK lifecycle against Test Suite via dev server |
| `npm run build:yt && npm run preview:yt` | Validates filename compliance and bundle size |

**Known limitation:** the Test Suite's "SDK loaded before any game code" check is a false
negative for Vite+`type="module"` local builds due to the `game_api/v1` redirect latency
racing against a locally-served module bundle. This does not affect the production ZIP —
in the real YouTube environment the SDK is provided by the platform before any game code runs.

## 7. Deployment Targets

| Target | Artifact | Platform |
|---|---|---|
| Public review URL | Cloudflare Pages (auto-deploy from `/dist`) | Cloudflare |
| YouTube Playables | `dist-zip/plates-game.zip` (manual upload) | YouTube Studio |

## 8. Dev-Only Environment Variable Guards

Any environment variable that is safe in development but dangerous if accidentally shipped
to `demo`/`yt-zip` gets a **build-time guard** in `vite.config.ts` (via `loadEnv()`), not
just a documentation warning — the build fails loudly rather than relying on developer
discipline.

| Variable | Dangerous value | Guarded in |
|---|---|---|
| `VITE_TIME_STRATEGY` | `FAST_FORWARD` | `demo`, `yt-zip` |
| `VITE_SPLASH_FORCED_DELAY_MS` | any value `> 0` | `demo`, `yt-zip` |

When adding a new dev-only env var, add a matching guard following this same pattern.