export { PlayerDO } from "./durable-objects/PlayerDO";

import type { Env } from "./env";
import { resolveCorsHeaders, handlePreflight } from "./cors";
import { handleAuthStart, handleAuthCallback, handleLogout, handlePlayerSession } from "./routes/authRoutes";
import { handleNormalEnter } from "./routes/normalEnter";
import { handleNormalAttempt } from "./routes/normalAttempt";
import { handlePlayerPrefs } from "./routes/playerPrefs";

const AUTH_START = /^\/auth\/([a-z]+)\/start$/;
const AUTH_CALLBACK = /^\/auth\/([a-z]+)\/callback$/;

type RouteEntry = { method: string; path: string; handler: (request: Request, env: Env) => Promise<Response> };

const ROUTES: RouteEntry[] = [
  { method: "POST", path: "/auth/logout", handler: handleLogout },
  { method: "GET", path: "/player/session", handler: handlePlayerSession },
  { method: "POST", path: "/normal/enter", handler: handleNormalEnter },
  { method: "POST", path: "/normal/attempt", handler: handleNormalAttempt },
  { method: "POST", path: "/player/prefs", handler: handlePlayerPrefs },
];

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  const startMatch = url.pathname.match(AUTH_START);
  if (startMatch && request.method === "GET") return handleAuthStart(request, env, startMatch[1]);

  const callbackMatch = url.pathname.match(AUTH_CALLBACK);
  if (callbackMatch && request.method === "GET") return handleAuthCallback(request, env, callbackMatch[1]);

  const entry = ROUTES.find((r) => r.method === request.method && r.path === url.pathname);
  if (!entry) return new Response("Not found", { status: 404 });
  return entry.handler(request, env);
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