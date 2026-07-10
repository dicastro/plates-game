import { dayKeyUtc } from "./dateKeys";
import type { TimeService } from "../../shared/time/TimeService";

/** The Worker's authoritative "what day is it" resolution — never trusts a client-supplied date. */
export function resolveTodayDaySeed(time: TimeService): string {
  return dayKeyUtc(time.now());
}