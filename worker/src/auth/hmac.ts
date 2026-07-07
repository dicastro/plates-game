// Shared HMAC-SHA256 signing primitive — the only piece session.ts (session
// cookie) and stateToken.ts (OAuth CSRF state param) actually have in
// common: "sign an arbitrary string payload, get a URL-safe signature back."

export async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}