import type { Env } from "../env";
import type { AuthProviderId } from "../../../shared/types";
import { verifySession } from "../auth/session";

export interface AuthenticatedSession {
  authProviderId: AuthProviderId;
  externalProviderId: string;
}

type SessionHandler = (request: Request, env: Env, session: AuthenticatedSession) => Promise<Response>;

/** Wraps a route handler that requires a valid session — returns 401 before the
 *  handler ever runs if the cookie is missing or invalid. */
export function withSession(handler: SessionHandler) {
  return async (request: Request, env: Env): Promise<Response> => {
    const session = await verifySession(request, env.SESSION_SIGNING_SECRET);
    if (!session) return new Response(null, { status: 401 });
    return handler(request, env, session);
  };
}