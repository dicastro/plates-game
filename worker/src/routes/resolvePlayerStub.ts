import type { Env } from "../env";
import type { AuthenticatedSession } from "./withSession";

export function resolvePlayerStub(env: Env, session: AuthenticatedSession) {
  const doId = env.PLAYER_DO.idFromName(`${session.authProviderId}:${session.externalProviderId}`);
  return env.PLAYER_DO.get(doId);
}