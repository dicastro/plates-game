import { timeService } from "./time/timeServiceInstance";
import { FastForwardTimeService } from "./time/strategies/FastForwardTimeService";

function isFastForward(service: unknown): service is FastForwardTimeService {
  return service instanceof FastForwardTimeService;
}

/** Single entry point for all dev-only window hooks. Called once at startup. */
export function installDevtools(): void {
  if (!import.meta.env.DEV) return;

  const w = window as unknown as Record<string, unknown>;
  const service = timeService;

  if (isFastForward(service)) {
    w["__SIMULATE_DATE_OFFSET__"] = (days: number) => service.setOffsetDays(days);
  }

  // Add further dev hooks here as needed — one `if` block per capability,
  // all installed from this single function.
}