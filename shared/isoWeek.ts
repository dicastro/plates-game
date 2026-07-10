export const MS_PER_DAY = 86_400_000;

export function previousWeekKeyUtc(epochMs: number): string {
  return weekKeyUtc(epochMs - 7 * MS_PER_DAY);
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
export function mondayOfIsoWeek1(year: number): number {
  const jan4 = Date.UTC(year, 0, 4);
  const jan4DayNum = (new Date(jan4).getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  return jan4 - jan4DayNum * MS_PER_DAY;
}