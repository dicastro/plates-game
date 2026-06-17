# Contributing Guide

This document covers the development workflow, commit conventions, and release process.
It is internal developer documentation — not intended for end users.

---

## Commit Message Convention

This project follows the **Conventional Commits** specification.
Format: `type(scope): concise description in imperative mood`

### Types

| Type | Version bump | Use for |
|---|---|---|
| `feat` | minor | New feature or game mode |
| `fix` | patch | Bug fix |
| `refactor` | patch | Code restructuring without behavior change |
| `perf` | patch | Performance improvement |
| `style` | none | Formatting, whitespace — no logic change |
| `docs` | none | Documentation only |
| `chore` | none | Build config, dependency updates, tooling |
| `revert` | patch | Reverting a previous commit |

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
npx release-it
```

This single command will:
1. Analyze commits since the last tag to determine the version bump.
2. Update `version` in `package.json`.
3. Generate / append the new section to `CHANGELOG.md`.
4. Create a Git commit (`chore: release vX.Y.Z`) and a Git tag (`vX.Y.Z`).

For a dry run without writing anything:
```bash
npx release-it --dry-run
```

### Pre-1.0.0 Bump Rules

| Change type | Bump |
|---|---|
| `feat` commits | `0.X.0` (minor) |
| `fix` / `refactor` / `perf` commits | `0.X.Y` (patch) |
| `docs` / `chore` / `style` commits only | No bump |
| Documentation or non-user-facing changes | No bump |

See `doc/functional/versioning-changelog.md` for the full versioning policy.