import type { TimeService } from "./TimeService";
import { RealClockTimeService } from "./strategies/RealClockTimeService";
import { FastForwardTimeService } from "./strategies/FastForwardTimeService";

export class TimeServiceFactory {
  static create(): TimeService {
    const strategy = import.meta.env.VITE_TIME_STRATEGY;

    switch (strategy) {
      case "FAST_FORWARD":
        return new FastForwardTimeService();
      case "REAL_CLOCK":
      default:
        return new RealClockTimeService();
    }
  }
}