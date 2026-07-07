// Verifies a Google-issued id_token (JWT, RS256) using Google's published
// JWKS. No external JWT library — Web Crypto (SubtleCrypto) natively
// supports RS256 verification against a JWK-imported public key.
//
// Simplification accepted for this pass: JWKS is fetched fresh on every
// verification (no caching). Google's keys rotate infrequently; caching
// via Cache API is a reasonable future optimization — see doc/NEXT_STEPS.md.

interface GoogleIdTokenPayload {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat: number;
}

function base64UrlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64url.length / 4) * 4, "=");
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function base64UrlDecodeJson<T>(b64url: string): T {
  const bytes = base64UrlToUint8Array(b64url);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

function normalizeIssuer(iss: string): string {
  return iss.replace(/^https?:\/\//, "");
}

export async function verifyGoogleIdToken(
  idToken: string,
  expectedAudience: string,
  jwksUrl: string,
  expectedIssuer: string
): Promise<{ sub: string }> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed id_token.");
  const [headerB64, payloadB64, sigB64] = parts;

  const header = base64UrlDecodeJson<{ kid: string; alg: string }>(headerB64);
  const payload = base64UrlDecodeJson<GoogleIdTokenPayload>(payloadB64);

  if (normalizeIssuer(payload.iss) !== normalizeIssuer(expectedIssuer)) {
    throw new Error("Unexpected id_token issuer.");
  }
  if (payload.aud !== expectedAudience) throw new Error("Unexpected id_token audience.");
  if (payload.exp * 1000 < Date.now()) throw new Error("id_token has expired.");

  const jwksResponse = await fetch(jwksUrl);
  if (!jwksResponse.ok) throw new Error("Failed to fetch Google JWKS.");

  const jwks = await jwksResponse.json<{ keys?: JsonWebKey[] }>();
  if (!Array.isArray(jwks.keys)) {
    throw new Error(`Malformed JWKS response from ${jwksUrl} — expected a JWK Set with a "keys" array (e.g. the v3 certs endpoint).`);
  }

  const matchingKey = jwks.keys.find((k) => (k as JsonWebKey & { kid?: string }).kid === header.kid);
  if (!matchingKey) throw new Error("No matching JWKS key for id_token.");

  const publicKey = await crypto.subtle.importKey(
    "jwk", matchingKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
  );

  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToUint8Array(sigB64);
  const isValid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, signedData);
  if (!isValid) throw new Error("id_token signature verification failed.");

  return { sub: payload.sub };
}