import { hmacSign } from "./hmac";
import { isSupportedAuthProviderId } from "./authProviderRegistry";
import type { AuthProviderId } from "../../../shared/types";
import type { SessionCookieSameSite } from "../env";

// Signs/verifies the httpOnly session cookie. Payload is intentionally
// `${authProvider}:${externalProviderId}` — NOT the internal playerId —
// because it must let every authenticated route recompute the same
// DurableObjectId via idFromName() without a lookup table. See
// PlayerDO's playerId field for the actual internal identifier, which is
// resolved only after loading the DO.

const COOKIE_NAME = "plates_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

export async function createSessionCookie(secret: string, authProviderId: AuthProviderId, externalProviderId: string, sameSite: SessionCookieSameSite): Promise<string> {
  const payload = `${authProviderId}:${externalProviderId}`;
  const sig = await hmacSign(secret, payload);
  const value = `${payload}.${sig}`;
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=${sameSite}; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

export function clearSessionCookie(sameSite: SessionCookieSameSite): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=${sameSite}; Path=/; Max-Age=0`;
}

/** Returns { authProviderId, externalProviderId } if the cookie is present and its signature is valid, else null. */
export async function verifySession(request: Request, secret: string): Promise<{ authProviderId: AuthProviderId; externalProviderId: string } | null> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;

  const value = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
  const lastDot = value.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = value.slice(0, lastDot);
  const sig = value.slice(lastDot + 1);
  const expectedSig = await hmacSign(secret, payload);
  if (sig !== expectedSig) return null; // tampered or forged

  const sepIndex = payload.indexOf(":");
  if (sepIndex === -1) return null;

  const authProviderId = payload.slice(0, sepIndex);
  if (!isSupportedAuthProviderId(authProviderId)) return null; // manipulada o proveedor retirado


  return { authProviderId, externalProviderId: payload.slice(sepIndex + 1) };
}