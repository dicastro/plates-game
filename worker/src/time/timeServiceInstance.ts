import type { TimeService } from "../../../shared/time/TimeService";
import { RealClockTimeService } from "../../../shared/time/strategies/RealClockTimeService";
import { FastForwardTimeService } from "../../../shared/time/strategies/FastForwardTimeService";
import type { Env } from "../env";

let instance: TimeService | null = null;

// Resolved lazily on first use (not at module load) because it needs `env`,
// which Cloudflare Workers only provide per-request — there is no
// import.meta.env equivalent Worker-side.
export function resolveTimeService(env: Env): TimeService {
  if (instance) return instance;
  instance = env.ENVIRONMENT_NAME === "production" ? new RealClockTimeService() : new FastForwardTimeService();
  return instance;
}