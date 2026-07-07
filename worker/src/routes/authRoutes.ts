import type { Env } from "../env";
import { createStateToken, verifyStateToken } from "../auth/stateToken";
import { createSessionCookie, clearSessionCookie } from "../auth/session";
import { withSession } from "./withSession";
import { resolvePlayerStub } from "./resolvePlayerStub";
import { isSupportedAuthProviderId, resolveAuthProvider } from "../auth/authProviderRegistry";

export async function handleAuthStart(request: Request, env: Env, providerId: string): Promise<Response> {
  if (!isSupportedAuthProviderId(providerId)) return new Response("Unknown auth provider.", { status: 404 });
  const provider = resolveAuthProvider(providerId);
  if (!provider) return new Response("Unknown auth provider.", { status: 404 });

  const intent = new URL(request.url).searchParams.get("intent") ?? "";
  const state = await createStateToken(env.SESSION_SIGNING_SECRET, intent);
  return Response.redirect(provider.buildAuthorizationUrl(env, state), 302);
}

export async function handleAuthCallback(request: Request, env: Env, providerId: string): Promise<Response> {
  if (!isSupportedAuthProviderId(providerId)) return new Response("Unknown auth provider.", { status: 404 });
  const provider = resolveAuthProvider(providerId);
  if (!provider) return new Response("Unknown auth provider.", { status: 404 });

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return new Response("Missing code or state.", { status: 400 });

  const verifiedState = await verifyStateToken(env.SESSION_SIGNING_SECRET, state);
  if (!verifiedState) return new Response("Invalid or expired state.", { status: 400 });

  const { externalProviderId } = await provider.handleCallback(env, code);
  const doId = env.PLAYER_DO.idFromName(`${providerId}:${externalProviderId}`);
  const stub = env.PLAYER_DO.get(doId);
  const country = request.headers.get("CF-IPCountry") ?? "XX";
  await stub.createIfMissing({ authProviderId: providerId, externalProviderId, country });

  const cookie = await createSessionCookie(env.SESSION_SIGNING_SECRET, providerId, externalProviderId);
  const redirectLocation = `${env.FRONTEND_BASE_URL}${verifiedState.intent ? `/?intent=${encodeURIComponent(verifiedState.intent)}` : "/"}`;
  return new Response(null, { status: 302, headers: { "Set-Cookie": cookie, Location: redirectLocation } });
}

export async function handleLogout(): Promise<Response> {
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearSessionCookie() } });
}

// See point 4 below re: why /player/session now requires `lang`.
export const handlePlayerSession = withSession(async (request, env, session) => {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang");
  if (!lang) return new Response("Missing lang.", { status: 400 });

  const stub = resolvePlayerStub(env, session);
  return Response.json(await stub.getPlayerProfileForLang(lang));
});