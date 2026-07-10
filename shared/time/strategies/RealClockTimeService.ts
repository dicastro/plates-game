import type { TimeService } from "../TimeService";

export class RealClockTimeService implements TimeService {
  now(): number {
    return Date.now();
  }
}