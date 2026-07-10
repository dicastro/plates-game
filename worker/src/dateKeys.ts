// Worker-only UTC period-key helpers. weekKeyUtc/mondayOfIsoWeek1 now live in
// shared/isoWeek.ts (needed by the client too, for week-range display) —
// this file only re-exports weekKeyUtc for existing call sites and keeps
// everything that's genuinely Worker-only (day/month/year keys, elapsed-
// period distance helpers).

import { MS_PER_DAY, mondayOfIsoWeek1 } from "../../shared/isoWeek";

export { weekKeyUtc } from "../../shared/isoWeek";

export function dayKeyUtc(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function monthKeyUtc(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 7); // "YYYY-MM"
}

export function yearKeyUtc(epochMs: number): string {
  return String(new Date(epochMs).getUTCFullYear());
}

function mondayEpochOfIsoWeekKey(weekKey: string): number {
  const [year, week] = weekKey.split("-W").map(Number);
  return mondayOfIsoWeek1(year) + (week - 1) * 7 * MS_PER_DAY;
}

export function daysBetween(fromDayKey: string, toDayKey: string): number {
  const from = Date.parse(`${fromDayKey}T00:00:00Z`);
  const to = Date.parse(`${toDayKey}T00:00:00Z`);
  return Math.round((to - from) / MS_PER_DAY);
}

// Calendar-month distance (e.g. 2026-01 → 2026-03 = 2), not day-based.
export function monthsBetween(fromMonthKey: string, toMonthKey: string): number {
  const [fy, fm] = fromMonthKey.split("-").map(Number);
  const [ty, tm] = toMonthKey.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

export function yearsBetween(fromYearKey: string, toYearKey: string): number {
  return Number(toYearKey) - Number(fromYearKey);
}

// Exact epoch-based diff — correct across year boundaries (e.g. 2026-W52 →
// 2027-W01 correctly yields 1, unlike a naive year*53+week ordinal formula).
export function weeksBetween(fromWeekKey: string, toWeekKey: string): number {
  if (fromWeekKey === toWeekKey) return 0;
  const fromEpoch = mondayEpochOfIsoWeekKey(fromWeekKey);
  const toEpoch = mondayEpochOfIsoWeekKey(toWeekKey);
  return Math.round((toEpoch - fromEpoch) / (7 * MS_PER_DAY));
}