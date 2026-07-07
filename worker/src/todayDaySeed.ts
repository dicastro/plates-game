import { dayKeyUtc } from "./dateKeys";

/** The Worker's authoritative "what day is it" resolution — never trusts a client-supplied date. */
export function resolveTodayDaySeed(): string {
  return dayKeyUtc(Date.now());
}