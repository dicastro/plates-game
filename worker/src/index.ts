export { PlayerDO } from "./durable-objects/PlayerDO";

import type { Env } from "./env";
import { resolveCorsHeaders, handlePreflight } from "./cors";
import { handleAuthStart, handleAuthCallback, handleLogout, handlePlayerSession } from "./routes/authRoutes";
import { handleNormalEnter } from "./routes/normalEnter";
import { handleNormalAttempt } from "./routes/normalAttempt";
import { handlePlayerPrefs } from "./routes/playerPrefs";
import { handleAliasCheck, handleAliasSetup } from "./routes/aliasRoutes";
import { handleLeaderboard, handleLeaderboardAvailable } from "./routes/leaderboardRoutes";
import { API_ROUTES, type AnyRouteDefinition } from "../../shared/apiRoutes";
import { ADVANCE_TIME_PATTERN, handleAdvanceTime } from "./dev/advanceTimeRoutes";
import type { AdvanceUnit } from "../../shared/time/strategies/FastForwardTimeService";

type Handler = (request: Request, env: Env, context: any) => Promise<Response>;

const HANDLERS: Record<keyof typeof API_ROUTES, Handler> = {
  playerSession: handlePlayerSession,
  normalEnter: handleNormalEnter,
  normalAttempt: handleNormalAttempt,
  playerPrefs: handlePlayerPrefs,
  authLogout: (_request, env) => handleLogout(env),
  authStart: handleAuthStart,
  authCallback: handleAuthCallback,
  aliasCheck: handleAliasCheck,
  aliasSetup: handleAliasSetup,
  leaderboardAvailable: handleLeaderboardAvailable,
  leaderboard: handleLeaderboard,
};

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (env.ENVIRONMENT_NAME !== "production") {
    const advanceMatch = url.pathname.match(ADVANCE_TIME_PATTERN);

    if (advanceMatch && request.method === "POST") {
      return handleAdvanceTime(env, advanceMatch[1] as AdvanceUnit);
    }
  }

  for (const [key, defRaw] of Object.entries(API_ROUTES)) {
    // The only cast in this whole design: iterating a Record whose values
    // have different PathParams/Query generics forces TS to erase them here
    // — there is no way to keep per-route types AND loop over a heterogeneous
    // collection at the same time. Everywhere else (handlers, build() calls)
    // stays fully typed.
    const def = defRaw as AnyRouteDefinition;
    if (def.method !== request.method) continue;
    
    const pathParams = def.matchPath(url.pathname);
    if (pathParams === null) continue; // path doesn't belong to this route — keep looking

    const parsed = def.parseQuery(url.searchParams, pathParams);
    if (!parsed.ok) {
      return new Response(`Bad request — missing query parameters: ${parsed.missingParams.join(", ")}.`, { status: 400 });
    }

    return HANDLERS[key as keyof typeof API_ROUTES](request, env, parsed.value);
  }

  return new Response("Not found", { status: 404 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const preflight = handlePreflight(request, env);
    if (preflight) return preflight;

    const response = await route(request, env);

    const corsHeaders = resolveCorsHeaders(request, env);
    if (!corsHeaders) return response;

    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<Env>;