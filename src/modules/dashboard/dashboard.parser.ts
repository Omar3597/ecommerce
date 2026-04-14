import { StatsQuery } from "./dashboard.validator";

export type TruncUnit = "day" | "week" | "month";

export type ParsedInterval = {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  trunc: TruncUnit;
};

const PERIOD_PRESETS = {
  week: { days: 7, trunc: "day" as TruncUnit },
  month: { days: 30, trunc: "day" as TruncUnit },
  year: { days: 365, trunc: "month" as TruncUnit },
} as const;

function subDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 86_400_000);
}

function inferTrunc(diffMs: number): TruncUnit {
  const days = diffMs / 86_400_000;
  if (days <= 90) return "day";
  if (days <= 365) return "week";
  return "month";
}

export function parseInterval(query: StatsQuery): ParsedInterval {
  const to = new Date();

  if ("period" in query) {
    const { days, trunc } = PERIOD_PRESETS[query.period];
    const from = subDays(to, days);
    const previousFrom = subDays(from, days);

    return { from, to, previousFrom, previousTo: from, trunc };
  }

  // custom range
  const { startDate: from, endDate } = query;
  const diffMs = endDate.getTime() - from.getTime();
  const previousFrom = new Date(from.getTime() - diffMs);

  return {
    from,
    to: endDate,
    previousFrom,
    previousTo: from,
    trunc: inferTrunc(diffMs),
  };
}
