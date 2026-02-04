export type QueryParams = Record<string, any>;

interface QueryResult {
  orderBy: any;
  skip: number;
  take: number;
}

export class QueryBuilder {
  protected query: QueryParams;
  private orderBy: any;
  private page: number;
  private limit: number;

  constructor(query: QueryParams) {
    this.query = query;

    this.page = Number(query.page) > 0 ? Number(query.page) : 1;

    const parsedLimit = Number(query.limit);
    this.limit =
      Number.isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 60
        ? 10
        : parsedLimit;

    this.orderBy = { createdAt: "desc" };
  }

  sort(allowedFields: string[]) {
    if (!this.query.sort) return this;

    const sortParam = this.query.sort as string;

    const field = sortParam.startsWith("-") ? sortParam.slice(1) : sortParam;

    if (!allowedFields.includes(field)) {
      return this; // ignore invalid sort field
    }

    this.orderBy = sortParam.startsWith("-")
      ? { [field]: "desc" }
      : { [field]: "asc" };

    return this;
  }

  build(): QueryResult {
    const skip = (this.page - 1) * this.limit;

    return {
      orderBy: this.orderBy,
      skip,
      take: this.limit,
    };
  }
}
