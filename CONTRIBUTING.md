# Contributing Guide

This document covers the development workflow, commit conventions, and release process.
It is internal developer documentation — not intended for end users.

---

## Commit Message Convention

This project follows the **Conventional Commits** specification.
Format: `type(scope): concise description in imperative mood`

### Types

### Types

| Type | Version bump | Use for | Example scenario |
|---|---|---|---|
| `feat` | minor | New feature or game mode | Adding Travel Mode, a new screen, a new theme |
| `fix` | patch | Bug fix | Correcting a wrong comparison in a build guard |
| `refactor` | patch | Code restructuring without behavior change | Splitting a component, renaming a file for clarity |
| `perf` | patch | Performance improvement | Reducing bundle size, optimizing a render path |
| `style` | none | Formatting, whitespace — no logic change | Reformatting, fixing indentation |
| `docs` | none | Documentation only | Updating `/doc`, README, this file |
| `chore` | none | Build config, dependency updates, tooling | Editing `vite.config.ts` guards, bumping a devDependency |
| `revert` | patch | Reverting a previous commit | Undoing a `feat` that broke something |

**Rule of thumb:** if a player would notice the change in gameplay or UI, it's `feat`/`fix`.
If only a developer would notice (build pipeline, docs, internal restructuring), it's
`refactor`/`chore`/`docs`/`style` and never bumps the minor version.

### Scope (optional but recommended)

Use the module or domain affected: `audio`, `crypto`, `platform`, `i18n`, `ui`, `scoring`, `build`.

### Examples

```
feat(scoring): implement jackpot pattern detection for plate digits
fix(crypto): handle tamper detection on malformed Base64 payload
refactor(audio): extract PRNG into standalone utility module
docs(i18n): document player updates authoring workflow
chore(build): add release-it configuration
```

### Rules
- Use **imperative mood**: "add", "fix", "extract" — not "added", "fixed", "extracted".
- No capital letter on the description. No period at the end.
- Keep the description under 72 characters.
- If a change required multiple correction cycles during development, the commit message
  reflects only the **final delivered result** — no mention of intermediate fixes.

---

## Release Workflow

### Dependencies

Add to `devDependencies` in `package.json`:

```json
"release-it": "^17.0.0",
"@release-it/conventional-changelog": "^8.0.0"
```

Install:
```bash
npm install --save-dev release-it @release-it/conventional-changelog
```

### Configuration (`.release-it.json` in project root)

```json
{
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": "conventionalcommits",
      "infile": "CHANGELOG.md"
    }
  },
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}"
  },
  "npm": {
    "publish": false
  },
  "hooks": {
    "before:init": ["npm run build"]
  }
}
```

### Releasing a New Version

```bash
npm run release
```

This single command will:
1. Analyze commits since the last tag to determine the version bump.
2. Update `version` in `package.json`.
3. Generate / append the new section to `CHANGELOG.md`.
4. Create a Git commit (`chore: release vX.Y.Z`) and a Git tag (`vX.Y.Z`).

For a dry run without writing anything:
```bash
npm run release:dry
```

### Pre-1.0.0 Bump Rules

| Change type | Bump |
|---|---|
| `feat` commits | `0.X.0` (minor) |
| `fix` / `refactor` / `perf` commits | `0.X.Y` (patch) |
| `docs` / `chore` / `style` commits only | No bump |
| Documentation or non-user-facing changes | No bump |

See `doc/functional/versioning-changelog.md` for the full versioning policy.