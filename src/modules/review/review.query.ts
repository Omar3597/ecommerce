import { QueryConfig } from "../../common/query/query.engine";

export const reviewsQuery: QueryConfig = {
  filter: {
    rating: { type: "number", ops: ["equals", "gte", "lte", "gt", "lt"] },
    comment: {
      type: "string",
      ops: ["equals", "contains"],
      defaultOp: "contains",
    },
    createdAt: { type: "date", ops: ["equals", "gte", "lte", "gt", "lt"] },
  },
  sort: ["comment", "rating", "createdAt", "updatedAt"],
  defaultLimit: 15,
  maxLimit: 70,
};
