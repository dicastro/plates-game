import type { TimeService } from "../TimeService";

export class FastForwardTimeService implements TimeService {
  private offsetDays = 0;

  setOffsetDays(days: number): void {
    this.offsetDays = days;
  }

  getCosmeticDate(): Date {
    const real = new Date();
    real.setUTCDate(real.getUTCDate() + this.offsetDays);
    return real;
  }
}