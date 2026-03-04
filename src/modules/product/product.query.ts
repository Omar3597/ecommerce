import { QueryConfig } from "../../common/query/query.engine";

export const productQuery: QueryConfig = {
  filter: {
    price: { type: "number", ops: ["equals", "gte", "lte", "gt", "lt"] },
    ratingAvg: { type: "number", ops: ["equals", "gte", "lte", "gt", "lt"] },
    ratingCount: { type: "number", ops: ["equals", "gte", "lte", "gt", "lt"] },
    name: {
      type: "string",
      ops: ["equals", "contains"],
      defaultOp: "contains",
    },
  },
  sort: ["price", "ratingAvg", "ratingCount", "createdAt", "name"],
  select: [
    "id",
    "name",
    "price",
    "ratingAvg",
    "summary",
    "ratingCount",
    "stock",
    "isHidden",
  ],

  defaultLimit: 20,
  maxLimit: 100,
};
