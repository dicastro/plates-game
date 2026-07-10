import { MS_PER_DAY } from "../../isoWeek";
import type { TimeService } from "../TimeService";

export type AdvanceUnit = "day" | "week" | "month" | "year";

// Dev-only. Holds an in-memory offset on top of the real clock.
// The offset lives in this instance only, which is fine — it's
// a manual dev tool, not persisted state.
export class FastForwardTimeService implements TimeService {
  private offsetMs = 0;

  now(): number {
    return Date.now() + this.offsetMs;
  }

  _computeAdvanceMs(fromEpochMs: number, unit: AdvanceUnit): number {
    const from = new Date(fromEpochMs);
    switch (unit) {
      case "day":
        return MS_PER_DAY;
      case "week": {
        const dayNum = (from.getUTCDay() + 6) % 7; // Mon=0..Sun=6
        return (7 - dayNum) * MS_PER_DAY;
      }
      case "month": {
        const target = Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1);
        return target - Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
      }
      case "year": {
        const target = Date.UTC(from.getUTCFullYear() + 1, 0, 1);
        return target - Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
      }
    }
  }

  advanceBy(unit: AdvanceUnit): { fromEpochMs: number; toEpochMs: number } {
    const fromEpochMs = this.now();
    this.offsetMs += this._computeAdvanceMs(fromEpochMs, unit);
    return { fromEpochMs, toEpochMs: this.now() };
  }
}