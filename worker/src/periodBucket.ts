// Plain-data bucket + pure advance function. Not a class: PlayerDO state is
// persisted via ctx.storage, which uses the structured clone algorithm —
// class instances lose their prototype (and thus their methods) on
// serialization/deserialization, so any "PeriodBucket" behavior must live
// in a standalone function operating on plain data, not on the object
// itself. Reused identically for week/month/year buckets.

export interface PeriodBucket {
  currentKey: string;
  currentTotal: number;
  previousKey: string;
  previousTotal: number;
}

export function emptyBucket(initialKey: string): PeriodBucket {
  return { currentKey: initialKey, currentTotal: 0, previousKey: "", previousTotal: 0 };
}

/**
 * Advances a bucket by `elapsedPeriods` (distance between the bucket's
 * current period and the new one, e.g. from weeksBetween()/monthsBetween()).
 * - elapsed === 0 → still the current period, accumulate.
 * - elapsed === 1 → real "previous period", close it out.
 * - elapsed  > 1  → gap too large; previous period is empty (a long-absent
 *   player's "previous X" reflects their last active period, not literally
 *   the calendar period immediately before today — see AI_CONTEXT.md).
 */
export function advanceBucket(bucket: PeriodBucket, elapsedPeriods: number, closingScore: number, newKey: string): PeriodBucket {
  if (elapsedPeriods === 0) {
    return { ...bucket, currentTotal: bucket.currentTotal + closingScore };
  }
  if (elapsedPeriods === 1) {
    return {
      currentKey: newKey,
      currentTotal: 0,
      previousKey: bucket.currentKey,
      previousTotal: bucket.currentTotal + closingScore,
    };
  }
  return emptyBucket(newKey);
}