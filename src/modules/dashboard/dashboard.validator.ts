import { z } from "zod";

const periodPresetSchema = z.object({
  period: z.enum(["week", "month", "year"]),
});

const customRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.startDate < d.endDate, {
    message: "startDate must be before endDate",
    path: ["endDate"],
  });

export const statsQuerySchema = z.object({
  query: z.union([periodPresetSchema, customRangeSchema]),
});

export type StatsQuery = z.infer<typeof statsQuerySchema>["query"];
