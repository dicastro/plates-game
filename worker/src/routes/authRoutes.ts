import type { Env } from "../env";
import { createStateToken, verifyStateToken } from "../auth/stateToken";
import { createSessionCookie, clearSessionCookie } from "../auth/session";
import { withSession } from "./withSession";
import { resolvePlayerStub } from "./resolvePlayerStub";
import { isSupportedAuthProviderId, resolveAuthProvider } from "../auth/authProviderRegistry";
import type { AuthStartContext, AuthCallbackContext, PlayerSessionContext } from "../../../shared/apiRoutes";

export async function handleAuthStart(_request: Request, env: Env, context: AuthStartContext): Promise<Response> {
  if (!isSupportedAuthProviderId(context.provider)) return new Response("Unknown auth provider.", { status: 404 });
  const providerId = context.provider;
  const provider = resolveAuthProvider(providerId);
  if (!provider) return new Response("Unknown auth provider.", { status: 404 });

  const state = await createStateToken(env.SESSION_SIGNING_SECRET, context.intent ?? "");
  return Response.redirect(provider.buildAuthorizationUrl(env, state), 302);
}

export async function handleAuthCallback(request: Request, env: Env, context: AuthCallbackContext): Promise<Response> {
  if (!isSupportedAuthProviderId(context.provider)) return new Response("Unknown auth provider.", { status: 404 });
  const providerId = context.provider;
  const provider = resolveAuthProvider(providerId);
  if (!provider) return new Response("Unknown auth provider.", { status: 404 });

  const verifiedState = await verifyStateToken(env.SESSION_SIGNING_SECRET, context.state);
  if (!verifiedState) return new Response("Invalid or expired state.", { status: 400 });

  const { externalProviderId } = await provider.handleCallback(env, context.code);
  const doId = env.PLAYER_DO.idFromName(`${providerId}:${externalProviderId}`);
  const stub = env.PLAYER_DO.get(doId);
  const country = request.headers.get("CF-IPCountry") ?? "XX";
  await stub.createIfMissing({ authProviderId: providerId, externalProviderId, country });

  const cookie = await createSessionCookie(env.SESSION_SIGNING_SECRET, providerId, externalProviderId, env.SESSION_COOKIE_SAME_SITE);
  const redirectLocation = `${env.FRONTEND_BASE_URL}${verifiedState.intent ? `/?intent=${encodeURIComponent(verifiedState.intent)}` : "/"}`;
  return new Response(null, { status: 302, headers: { "Set-Cookie": cookie, Location: redirectLocation } });
}

export async function handleLogout(env: Env): Promise<Response> {
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearSessionCookie(env.SESSION_COOKIE_SAME_SITE) } });
}

// See point 4 below re: why /player/session now requires `lang`.
export const handlePlayerSession = withSession<PlayerSessionContext>(async (_request, env, session, context) => {
  const stub = resolvePlayerStub(env, session);
  return Response.json(await stub.getPlayerProfileForLang(context.lang));
});