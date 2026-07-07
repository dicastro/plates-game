import { hmacSign } from "./hmac";

// Stateless, HMAC-signed OAuth `state` param — no KV/storage needed to
// track pending auth attempts. Encodes an issuedAt timestamp so the
// callback can reject stale/replayed state values.

const MAX_STATE_AGE_MS = 10 * 60 * 1000; // 10 minutes

export async function createStateToken(secret: string, intent: string = ""): Promise<string> {
  const nonce = crypto.randomUUID();
  const issuedAt = Date.now();
  const payload = `${nonce}.${issuedAt}.${intent}`;
  const sig = await hmacSign(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyStateToken(secret: string, token: string): Promise<{ intent: string } | null> {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [nonce, issuedAtStr, intent, sig] = parts;
  const payload = `${nonce}.${issuedAtStr}.${intent}`;
  const expectedSig = await hmacSign(secret, payload);
  if (sig !== expectedSig) return null;

  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > MAX_STATE_AGE_MS) return null;
  return { intent };
}