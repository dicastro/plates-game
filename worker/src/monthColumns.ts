export const MONTH_COLUMNS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"] as const;
export type MonthColumn = typeof MONTH_COLUMNS[number];