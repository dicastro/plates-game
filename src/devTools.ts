import { timeService } from "./time/timeServiceInstance";
import { type AdvanceUnit } from "../shared/time/strategies/FastForwardTimeService";
import { isFastForwardTimeService } from "../shared/time/timeServiceInstance";


/** Single entry point for all dev-only window hooks. Called once at startup. */
export function installDevtools(): void {
  if (!import.meta.env.DEV) return;

  const w = window as unknown as Record<string, unknown>;
  const service = timeService;

  if (isFastForwardTimeService(service)) {
    w["__ADVANCE_TIME_BY__"] = (unit: AdvanceUnit) => service.advanceBy(unit);
  }

  // Add further dev hooks here as needed — one `if` block per capability,
  // all installed from this single function.
}