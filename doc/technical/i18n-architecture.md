# Internationalization (i18n) Architecture

## 1. Design Principles

- Zero external libraries. Implemented via a custom React hook and TypeScript schema.
- Two distinct i18n layers with different growth rates and loading strategies.

## 2. UI Strings Layer (`src/i18n/locales/`)

Strongly typed, always loaded synchronously.

### Structure
```
src/i18n/
├── locales/
│   ├── en.ts          ← Ground-truth schema (source of truth)
│   └── es.ts          ← Implements TranslationSchema
├── types.ts           ← exports TranslationSchema (typeof en)
└── useTranslation.ts  ← Custom hook
```

### Rules
- `en.ts` defines the ground-truth `TranslationSchema`.
- All other locale files must implement `TranslationSchema` — TypeScript enforces completeness.
- Component text is **never hardcoded**. Always use `t('namespace.key')`.
- Missing keys fall back to the English value before rendering the key path as a string.

### `useTranslation` Hook
- Detects locale via `navigator.language` (sliced to 2 chars, lowercased).
- Falls back to `"en"` if the detected locale is not in `SUPPORTED`.
- Supports primitive variable injection: `t('key', { count: 3 })` → replaces `{{count}}`.

### Adding a New UI Language
1. Create `src/i18n/locales/XX.ts` implementing `TranslationSchema`.
2. Add `XX` to the `SUPPORTED` record in `useTranslation.ts`.

## 3. Player Updates Layer (`src/i18n/updates/`)

Editorial content, lazy-loaded, JSON format. See `doc/functional/player-updates.md`
for the full authoring workflow and display logic.

### Structure
```
src/i18n/updates/
├── en.json
├── es.json
└── fr.json
```

### Entry format
```json
{
  "0.2.0": ["Player-facing change description."],
  "0.3.0": ["Another change players care about."]
}
```

- Keys: semver strings matching `package.json` version.
- Values: arrays of plain strings, one per notable change.
- Only versions with player-relevant changes have entries.

### Adding a New Updates Language
1. Create `src/i18n/updates/XX.json` with the same version keys as `en.json`.
2. No TypeScript changes required — the loader handles missing files gracefully.

## 4. Language Detection Priority (Future)

When `YouTubePlatform` is active, locale detection should prefer
`PlatformService.getLanguage()` (maps to `ytgame.system.getLanguage()`) over
`navigator.language`, as YouTube may override the browser's reported locale.
This abstraction is already in place via the `PlatformService` interface.