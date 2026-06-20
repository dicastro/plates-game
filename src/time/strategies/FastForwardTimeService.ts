import type { TimeService } from "../TimeService";

const IS_DEV = import.meta.env.DEV;

/**
 * Dev-only strategy. Applies a day offset on top of the real clock so cosmetic
 * date-dependent features (Theme, Badges) can be tested without waiting for the
 * actual calendar date. The offset lives only in memory for this session.
 */
export class FastForwardTimeService implements TimeService {
  private offsetDays = 0;

  constructor() {
    if (IS_DEV) {
      (window as unknown as Record<string, unknown>)["__SIMULATE_DATE_OFFSET__"] =
        (days: number) => { this.offsetDays = days; };
    }
  }

  getCosmeticDate(): Date {
    const real = new Date();
    real.setUTCDate(real.getUTCDate() + this.offsetDays);
    return real;
  }
}