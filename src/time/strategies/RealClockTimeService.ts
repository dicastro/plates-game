import type { TimeService } from "../TimeService";

export class RealClockTimeService implements TimeService {
  getCosmeticDate(): Date {
    return new Date();
  }
}