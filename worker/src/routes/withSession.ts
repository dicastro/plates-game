import type { Env } from "../env";
import type { AuthProviderId } from "../../../shared/types";
import { verifySession } from "../auth/session";

export interface AuthenticatedSession {
  authProviderId: AuthProviderId;
  externalProviderId: string;
}

type SessionHandler<Context> = (request: Request, env: Env, session: AuthenticatedSession, context: Context) => Promise<Response>;
type NoContextSessionHandler = (request: Request, env: Env, session: AuthenticatedSession) => Promise<Response>;

export function withSession(handler: NoContextSessionHandler): (request: Request, env: Env) => Promise<Response>;
export function withSession<Context>(handler: SessionHandler<Context>): (request: Request, env: Env, context: Context) => Promise<Response>;
export function withSession<Context>(handler: SessionHandler<Context> | NoContextSessionHandler) {
  return async (request: Request, env: Env, context?: Context): Promise<Response> => {
    const session = await verifySession(request, env.SESSION_SIGNING_SECRET);
    if (!session) return new Response(null, { status: 401 });
    return context === undefined
      ? (handler as NoContextSessionHandler)(request, env, session)
      : (handler as SessionHandler<Context>)(request, env, session, context);
  };
}