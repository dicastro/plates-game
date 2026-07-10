import type { TimeService } from "../../shared/time/TimeService";
import { RealClockTimeService } from "../../shared/time/strategies/RealClockTimeService";
import { FastForwardTimeService } from "../../shared/time/strategies/FastForwardTimeService";

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