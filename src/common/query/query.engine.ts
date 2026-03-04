export type FieldType = "string" | "number" | "boolean" | "date";
export type Operator = "equals" | "contains" | "gte" | "lte" | "gt" | "lt";

export type FieldConfig = {
  type: FieldType;
  ops: Operator[];
  defaultOp?: Operator;
};

export type QueryConfig = {
  filter: Record<string, FieldConfig>;
  sort: string[];
  select?: string[]; // optional; if omitted -> no select (return full model)
  defaultLimit?: number;
  maxLimit?: number;
};

export type PrismaArgs = {
  where?: any;
  orderBy?: any[];
  select?: Record<string, true>;
  skip?: number;
  take?: number;
};

function coerce(v: any, t: FieldType): any {
  if (Array.isArray(v)) return v.map((x) => coerce(x, t));
  if (typeof v !== "string") return v;

  if (t === "number") {
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  }
  if (t === "boolean") {
    if (v === "true") return true;
    if (v === "false") return false;
    return v;
  }
  if (t === "date") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d;
  }
  return v;
}

function parseSort(sortRaw: any) {
  if (typeof sortRaw !== "string" || !sortRaw.trim()) return [];
  return sortRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) =>
      s.startsWith("-")
        ? { field: s.slice(1), dir: "desc" as const }
        : { field: s, dir: "asc" as const },
    );
}

function parseFields(fieldsRaw: any) {
  if (typeof fieldsRaw !== "string" || !fieldsRaw.trim()) return null;
  return fieldsRaw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

export function buildPrismaArgs(rawQuery: any, cfg: QueryConfig): PrismaArgs {
  const page = Math.max(1, Number(rawQuery.page) || 1);
  const maxLimit = cfg.maxLimit ?? 100;
  const defaultLimit = cfg.defaultLimit ?? 20;
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number(rawQuery.limit) || defaultLimit),
  );

  const filtersObj = rawQuery.filter;
  const whereAND: any[] = [];

  if (
    filtersObj &&
    typeof filtersObj === "object" &&
    !Array.isArray(filtersObj)
  ) {
    for (const [apiField, rawVal] of Object.entries(filtersObj)) {
      const fc = cfg.filter[apiField];
      if (!fc) continue; // MVP: تجاهل الحقول غير المسموحة بدل ما نرمي error

      // filter[field][op]=value
      if (rawVal && typeof rawVal === "object" && !Array.isArray(rawVal)) {
        for (const [opRaw, v] of Object.entries(rawVal)) {
          const op = opRaw as Operator;
          if (!fc.ops.includes(op)) continue;

          const casted = coerce(v, fc.type);

          const cond: any = {};
          if (op === "equals") {
            cond[apiField] = casted;
          } else if (op === "contains") {
            cond[apiField] = { contains: casted, mode: "insensitive" };
          } else {
            cond[apiField] = { [op]: casted };
          }

          whereAND.push(cond);
        }
        continue;
      }

      // filter[field]=value => use defaultOp (or equals)
      const op = fc.defaultOp ?? "equals";
      if (!fc.ops.includes(op)) continue;

      const casted = coerce(rawVal, fc.type);
      const cond: any = {};

      if (op === "contains") {
        cond[apiField] = { contains: casted, mode: "insensitive" };
      } else {
        cond[apiField] = casted;
      }

      whereAND.push(cond);
    }
  }

  const sortParsed = parseSort(rawQuery.sort)
    .filter((s) => cfg.sort.includes(s.field))
    .map((s) => ({ [s.field]: s.dir }));

  const requestedFields = parseFields(rawQuery.fields);
  let select: Record<string, true> | undefined = undefined;

  if (requestedFields && cfg.select) {
    const allowed = new Set(cfg.select);
    const picked = requestedFields.filter((f) => allowed.has(f));
    if (picked.length) {
      select = picked.reduce(
        (acc, f) => {
          acc[f] = true;
          return acc;
        },
        {} as Record<string, true>,
      );
    }
  }

  const args: PrismaArgs = {
    where: whereAND.length ? { AND: whereAND } : undefined,
    orderBy: sortParsed.length ? sortParsed : undefined,
    select,
    skip: (page - 1) * limit,
    take: limit,
  };

  return args;
}
