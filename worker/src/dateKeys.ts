// Pure, dependency-free UTC period-key helpers. Server-side only — the Worker
// resolves the authoritative epoch itself; this module never trusts a
// client-supplied timestamp. All arithmetic is UTC-only (no DST concerns)
// and relies on native Date.UTC/getUTC* methods, which already implement
// Gregorian calendar math (including leap years) correctly — no date
// library needed for that part. The one place a naive approach previously
// went wrong was ISO-week distance across year boundaries; weeksBetween()
// below fixes that with a real epoch-based diff instead of an ordinal
// approximation.

const MS_PER_DAY = 86_400_000;

export function dayKeyUtc(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function monthKeyUtc(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 7); // "YYYY-MM"
}

export function yearKeyUtc(epochMs: number): string {
  return String(new Date(epochMs).getUTCFullYear());
}

// ISO-8601 week: Monday-start, week 1 contains the year's first Thursday.
export function weekKeyUtc(epochMs: number): string {
  const d = new Date(epochMs);
  const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const dayNum = (new Date(utcMidnight).getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  const thursday = utcMidnight - dayNum * MS_PER_DAY + 3 * MS_PER_DAY;
  const thursdayDate = new Date(thursday);
  const firstThursdayOfYear = mondayOfIsoWeek1(thursdayDate.getUTCFullYear()) + 3 * MS_PER_DAY;
  const weekNum = 1 + Math.round((thursday - firstThursdayOfYear) / (7 * MS_PER_DAY));
  return `${thursdayDate.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// Monday of ISO week 1 for a given year (week 1 always contains Jan 4th).
function mondayOfIsoWeek1(year: number): number {
  const jan4 = Date.UTC(year, 0, 4);
  const jan4DayNum = (new Date(jan4).getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  return jan4 - jan4DayNum * MS_PER_DAY;
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