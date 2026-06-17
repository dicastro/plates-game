# Player Updates System

## 1. Purpose

Distinct from the technical `CHANGELOG.md`, this system surfaces **player-relevant** changes
(rule updates, new languages, dictionary changes, new modes) the first time a player launches
the game after a new version is deployed.

## 2. Authoring Workflow

1. A new version is released; `CHANGELOG.md` is updated automatically by `release-it`.
2. Developer extracts player-relevant changes and writes a draft in **Spanish**.
3. Developer reviews and approves the Spanish draft.
4. AI translates the approved Spanish text into all other supported languages.
5. Translated strings are added to the appropriate `src/i18n/updates/XX.json` files.

## 3. File Structure

```
src/i18n/
├── locales/        ← UI strings (TypeScript, strongly typed, always loaded)
│   ├── en.ts
│   └── es.ts
└── updates/        ← Player release notes (JSON, lazy-loaded, content-only)
    ├── en.json
    ├── es.json
    └── fr.json
```

### Entry format (`src/i18n/updates/es.json`)
```json
{
  "0.2.0": [
    "Nuevo modo de juego: Travel Mode disponible.",
    "Diccionario en español ampliado con 2.000 palabras nuevas."
  ],
  "0.3.0": [
    "Puntuación extra por patrones especiales en la matrícula."
  ]
}
```

- Keys are **semver strings** matching `package.json` version.
- Values are arrays of plain strings — one entry per notable change.
- Entries only exist for versions that contain player-relevant changes.

## 4. Display Logic

- On game launch, the platform loads the player's last-seen version from persistent storage key `lastSeenVersion`.
- The system collects all update entries for versions **between** `lastSeenVersion` (exclusive)
  and the current `APP_VERSION` (inclusive), in ascending semver order.
- If the collected list is non-empty, a **What's New** modal is displayed before the main menu.
- After dismissal, `lastSeenVersion` is updated to `APP_VERSION` and persisted.
- The correct language file is selected via the standard `useTranslation` locale detection.

## 5. Scope of Player-Relevant Changes

Include in player updates:
- New game modes or significant feature additions
- Changes to scoring rules or game mechanics
- New dictionary languages supported
- Significant dictionary updates (major word additions/removals)
- Changes to daily reset timing or attempt limits

Exclude from player updates:
- Bug fixes with no visible gameplay impact
- Refactors, build pipeline changes
- Internal security improvements
- Documentation changes