# Security & Anti-Cheat Architecture

## 1. Dictionary Validation Engine

### Format
Dictionaries are precompiled offline into arrays of SHA-256 hex strings:
```
["8bc2...", "1a4f...", "f5a2..."]
```
Served via Cloudflare CDN under gzip/brotli compression. No plaintext words ever in the bundle.

### Validation Flow
1. User submits a string (e.g., `"Canto"`).
2. Extract `string.length` for scoring.
3. Verify the string contains the active day's 3 consonants.
4. Hash `lowercase(input) + VITE_DICTIONARY_SALT` → SHA-256.
5. `DictionarySet.has(userHash)` → valid/invalid.

### Salt Protection (Anti-Rainbow Table)
All word signatures are compiled with a dynamic salt:
`SHA-256(lowercase_word + project_secret_salt)`

The frontend appends `VITE_DICTIONARY_SALT` before hashing. The salt is never exposed in
plaintext — obfuscated in the production bundle via `stringArray` + `splitStrings` in
`vite.config.ts`.

## 2. Temporal Anti-Cheat

- Daily challenge resets globally at **00:00 UTC**. Client clocks are never trusted.
- On `PlatformService.initialize()`, production environments fetch the canonical UTC epoch
  from a secure Cloudflare Worker endpoint.
- All game timers, seed derivation, and daily countdown rely on this server-provided baseline.
- Client-side `new Date()` is strictly forbidden for any game-logic timing.

## 3. Opaque Persistence Layer (Console Injection Shield)

### Payload Structure
State never stores open values (e.g., `attempts: 3`). Instead, it stores a ledger:
```json
{ "attemptsLedger": ["hash1", "hash2"] }
```

### Envelope Format
All data written to `PlatformService.saveData()` is wrapped by `PayloadCrypto.seal()`:
```json
{
  "version": 1,
  "payload": "U2FsdGVkX19v...",
  "signature": "e3b0c44298fc..."
}
```

### Tamper Detection
On `loadData()`:
- Signature is recomputed and compared. Mismatch → `TAMPER_DETECTED` → key cleared, day locked.
- Raw JSON without envelope structure → injection attempt logged → key removed, day locked.
- `version` ahead of current `SCHEMA_VERSION` → `SCHEMA_VERSION_AHEAD` error → data discarded.

See `doc/technical/persistence-schema.md` for migration protocol.

## 4. Leaderboard Integrity & Identity Binding

- Encrypted payload binds the player's platform `userId` and the active day's UTC seed.
- Replay attack mitigation: copying another user's save state triggers identity/seed mismatch
  on decryption → immediate session invalidation.
- Score submissions to `PlatformService.submitScore()` require a cryptographic token issued
  by the Cloudflare Worker (see §5). Direct console invocations are structurally rejected.

## 5. Edge Server Verification Flow (Cloudflare Worker Verdict)

The Cloudflare Worker is the **sole authority** on match legitimacy. Client-side validation
is UX-only (instant feedback). Leaderboard authorization requires a Worker-signed token.

### Flow
1. On puzzle completion or attempt exhaustion, the client POSTs to the Worker:
   - `userId` (platform identifier)
   - `daySeed` (active puzzle configuration)
   - Plain-text sequence of attempted words
   - Elapsed resolution time

2. The Worker (isolated, private environment):
   - Appends the private `VITE_DICTIONARY_SALT` (stored as encrypted Cloudflare env var) to each word.
   - Hashes and validates against the master dictionary set.
   - Re-verifies 3-consonant containment and checks for time-drift anomalies.

3. If legitimate, the Worker returns a short-lived cryptographic token.

4. The client uses this token to invoke `PlatformService.submitScore()`.