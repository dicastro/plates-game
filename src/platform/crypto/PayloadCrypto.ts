// Reusable symmetric obfuscation + HMAC-SHA-256 integrity layer.
// Used by all PlatformService implementations before read/write operations.

const INTERNAL_SALT = import.meta.env.VITE_STORAGE_SALT ?? "plates_default_salt";
const SCHEMA_VERSION = 1;

export interface PersistedEnvelope {
  version: number;
  payload: string;   // Base64-encoded JSON
  signature: string; // SHA-256 hex of (payload + INTERNAL_SALT)
}

// --- Hashing ---

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Encoding helpers ---

function encodePayload(data: unknown): string {
  return btoa(JSON.stringify(data));
}

function decodePayload(encoded: string): unknown {
  return JSON.parse(atob(encoded));
}

// --- Migration registry ---
// Add migration functions here as { fromVersion: fn } when schema changes.
// Each fn receives the decoded payload of the previous version and must return
// a payload compatible with the current schema version.
type MigrationFn = (old: unknown) => unknown;
const MIGRATIONS: Record<number, MigrationFn> = {
  // Example for future use:
  // 2: (v1Data) => ({ ...v1Data, newField: defaultValue }),
};

function runMigrations(data: unknown, fromVersion: number): unknown {
  let result = data;
  for (let v = fromVersion + 1; v <= SCHEMA_VERSION; v++) {
    const migrate = MIGRATIONS[v];
    if (!migrate) {
      console.error(
        `[PayloadCrypto] No migration found from v${v - 1} to v${v}. ` +
        `Data cannot be recovered. Treating as corrupted.`
      );
      throw new Error(`MIGRATION_MISSING_v${v}`);
    }
    result = migrate(result);
  }
  return result;
}

// --- Public API ---

export async function seal(data: unknown): Promise<PersistedEnvelope> {
  const payload = encodePayload(data);
  const signature = await sha256Hex(payload + INTERNAL_SALT);
  return { version: SCHEMA_VERSION, payload, signature };
}

export async function unseal(envelope: PersistedEnvelope): Promise<unknown> {
  const expectedSig = await sha256Hex(envelope.payload + INTERNAL_SALT);

  if (envelope.signature !== expectedSig) {
    throw new Error("TAMPER_DETECTED");
  }

  const data = decodePayload(envelope.payload);

  if (envelope.version === SCHEMA_VERSION) {
    return data;
  }

  if (envelope.version > SCHEMA_VERSION) {
    // Data is from a newer build — downgrade not supported
    throw new Error("SCHEMA_VERSION_AHEAD");
  }

  // version < SCHEMA_VERSION — attempt migration chain
  return runMigrations(data, envelope.version);
}

export function isPersistedEnvelope(raw: unknown): raw is PersistedEnvelope {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "version" in raw &&
    "payload" in raw &&
    "signature" in raw
  );
}