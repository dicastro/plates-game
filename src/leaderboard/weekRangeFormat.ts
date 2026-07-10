import { MS_PER_DAY, mondayOfIsoWeek1 } from "../../shared/isoWeek";

export function isoWeekKeyToRange(weekKey: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = weekKey.split("-W");
  const start = new Date(mondayOfIsoWeek1(Number(yearStr)) + (Number(weekStr) - 1) * 7 * MS_PER_DAY);
  return { start, end: new Date(start.getTime() + 6 * MS_PER_DAY) };
}