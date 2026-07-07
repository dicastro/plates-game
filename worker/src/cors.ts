// worker/src/cors.ts
import type { Env } from "./env";

function parseAllowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
}

/** Returns CORS headers if the request's Origin is allow-listed, or null otherwise
 *  (same-origin requests, or non-browser callers, send no Origin header at all). */
export function resolveCorsHeaders(request: Request, env: Env): HeadersInit | null {
  const origin = request.headers.get("Origin");
  if (!origin || !parseAllowedOrigins(env).includes(origin)) return null;

  return {
    "Access-Control-Allow-Origin": origin, // never "*" — credentials require an explicit origin
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function handlePreflight(request: Request, env: Env): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: resolveCorsHeaders(request, env) ?? {} });
}