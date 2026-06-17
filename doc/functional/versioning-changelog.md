# Versioning & Changelog Strategy

## 1. Version Format

`major.minor.patch` — managed in `package.json`.

## 2. Bump Rules (Pre-1.0.0 Phase)

| Change type | Bump |
|---|---|
| New feature or significant refactor | `0.X.0` (minor) |
| Bug fix or small improvement | `0.X.Y` (patch) |
| Documentation only (non-user-facing) | No bump |
| User-facing documentation or content | `0.X.Y` (patch) |

Schema version (`SCHEMA_VERSION` in `PayloadCrypto.ts`) is **frozen at 1** until `1.0.0`.
Breaking schema changes before `1.0.0` discard existing data silently — no migration required,
as all data is development test data.

## 3. Bump Rules (Post-1.0.0 Phase)

Follows strict Semantic Versioning:
- `major`: breaking changes to game rules, scoring formula, or save schema (requires migration)
- `minor`: new features, new game modes, new language support
- `patch`: bug fixes, dictionary updates, UI polish

## 4. Automated Changelog (`CHANGELOG.md`)

Toolchain: **`release-it`** + **`@release-it/conventional-changelog`**.

- Reads commit messages following the Conventional Commits format (`feat:`, `fix:`, `refactor:`, `docs:`, etc.).
- Automatically bumps `package.json` version and generates/appends `CHANGELOG.md` on each release.
- `docs:` commits do not trigger a version bump.
- `CHANGELOG.md` is the **technical** changelog — it targets developers, not players.

### Configuration (`.release-it.json` — to be created)
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
  "npm": { "publish": false }
}
```

## 5. Commit Message Rules (AI Workflow)

- Documentation is only updated and a commit message is generated **after the developer
  explicitly validates a change as accepted**.
- If a feature required multiple back-and-forth correction cycles, the commit message
  reflects only the **final delivered result** — no mention of intermediate fixes.
- Format: `type(scope): concise description` — e.g., `feat(audio): add deterministic PRNG engine`