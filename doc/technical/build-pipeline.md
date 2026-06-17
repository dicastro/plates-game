# Build Pipeline & Deployment

## 1. Target

A single self-contained flat directory zipped as `plates-game.zip`, containing `index.html`
and all assets, safely under YouTube's bundle size cap (target: < 2MB, hard limit: 5–10MB).

## 2. Pipeline Stages (`npm run build`)

1. **TypeScript compilation** — `tsc -b` enforces strict typing across `tsconfig.app.json` and `tsconfig.node.json`.
2. **Vite bundle** — tree-shaken ES2020 output to `/dist`. Source maps disabled (`sourcemap: false`).
3. **Obfuscation** — `rollup-obfuscator` (wraps `javascript-obfuscator`) applied exclusively in `production` mode.
4. **ZIP packaging** — `vite-plugin-zip-pack` compresses `/dist` → `dist-zip/plates-game.zip`.

## 3. Obfuscation Configuration

| Option | Value | Rationale |
|---|---|---|
| `controlFlowFlattening` | `true` (threshold 0.75) | Defeats static analysis |
| `deadCodeInjection` | `true` (threshold 0.4) | Misleads reverse engineers |
| `stringArray` | `true` (threshold 0.75) | Hides all string literals |
| `stringArrayEncoding` | `["base64"]` | Encodes strings at compile time |
| `splitStrings` | `true` (chunkLength 5) | Fragments salts and long strings |
| `renameGlobals` | **`false`** | **CRITICAL — preserves `window.ytgame` entry points** |

## 4. Local Development

```bash
npm run dev    # Vite HMR, MEMORY strategy, no obfuscation
npm run build  # Full production pipeline → dist-zip/plates-game.zip
```

## 5. Deployment Targets

| Target | Artifact | Platform |
|---|---|---|
| Public review URL | Cloudflare Pages (auto-deploy from `/dist`) | Cloudflare |
| YouTube Playables | `dist-zip/plates-game.zip` (manual upload) | YouTube Studio |

## 6. Automated Versioning & Changelog

Toolchain: `release-it` + `@release-it/conventional-changelog` (to be installed).
See `doc/functional/versioning-changelog.md` for bump rules and configuration.