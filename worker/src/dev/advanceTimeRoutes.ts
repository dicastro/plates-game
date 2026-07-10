import type { Env } from "../env";
import { resolveTimeService } from "../time/timeServiceInstance";
import { isFastForwardTimeService } from "../../../shared/time/timeServiceInstance";
import { dayKeyUtc } from "../dateKeys";
import type { AdvanceUnit } from "../../../shared/time/strategies/FastForwardTimeService";

export const ADVANCE_TIME_PATTERN = /^\/dev\/advance-time\/(day|week|month|year)$/;

interface AdvanceTimeResult {
  fromDaySeed: string;
  toDaySeed: string;
}

// Advances the Worker's own global clock offset — affects every player
// uniformly, exactly like real time passing. No PlayerDO is touched here;
// each player's rollover still only happens lazily, the next time *that*
// player makes a request (ensureLangRow's existing logic, untouched).
export async function handleAdvanceTime(env: Env, unit: AdvanceUnit): Promise<Response> {
  const time = resolveTimeService(env);
  
  if (!isFastForwardTimeService(time)) {
    return new Response("Time advancement is unavailable outside development/staging.", { status: 403 });
  }

  const { fromEpochMs, toEpochMs } = time.advanceBy(unit);

  const result: AdvanceTimeResult = { fromDaySeed: dayKeyUtc(fromEpochMs), toDaySeed: dayKeyUtc(toEpochMs) };
  return Response.json(result);
}