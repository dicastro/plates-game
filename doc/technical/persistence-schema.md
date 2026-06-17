# Persistence Schema & Migration Architecture

## Current Schema Version: 1

All data persisted via `PlatformService.saveData()` is wrapped in a `PersistedEnvelope` before writing to any storage backend.

## Envelope Structure

```json
{
  "version": 1,
  "payload": "<Base64-encoded JSON string>",
  "signature": "<SHA-256 hex of (payload + INTERNAL_SALT)>"
}
```

## Integrity Policy

- On `loadData()`, the signature is recomputed and compared against the stored value.
- A mismatch triggers `TAMPER_DETECTED`: data is discarded and the key is cleared.
- A raw JSON object without the envelope structure triggers an injection-attempt log
  and immediate key removal.

## Versioning & Migration

- `SCHEMA_VERSION` is the single source of truth, defined in `PayloadCrypto.ts`.
- If the stored `version` equals `SCHEMA_VERSION`, data is returned as-is.
- If the stored `version` is **lower**, the migration chain in `MIGRATIONS` is
  executed sequentially from `storedVersion + 1` up to `SCHEMA_VERSION`.
- If a migration function for an intermediate version is absent, an error is logged
  and `null` is returned — data is treated as unrecoverable.
- If the stored `version` is **higher** than the current build's `SCHEMA_VERSION`,
  a `SCHEMA_VERSION_AHEAD` error is thrown (downgrade not supported).

## Adding a Migration (future reference)

1. Increment `SCHEMA_VERSION` in `PayloadCrypto.ts`.
2. Add an entry to the `MIGRATIONS` record:

```typescript
const MIGRATIONS: Record<number, MigrationFn> = {
  2: (v1Data) => ({ ...(v1Data as V1Shape), newField: defaultValue }),
};
```

3. Update this document to reflect the new schema version and describe the change.

## Salt Configuration

- Development: `VITE_STORAGE_SALT` in `.env.development`.
- Production (Cloudflare/YouTube): must be set as an encrypted environment
  variable in the Cloudflare dashboard — never committed to the repository.