import { Prisma } from "../../../generated/prisma/client";
import { QueryBuilder, QueryParams } from "../../common/utils/queryBuilder";

const PRODUCT_SORT_WHITELIST = [
  "price",
  "name",
  "ratingAvg",
  "ratingCount",
  "createdAt",
];

const PRODUCT_FILTER_WHITELIST = [
  "category",
  "ratingAvg",
  "ratingCount",
  "price",
];

const PRODUCT_FIELDS_WHITELIST = [
  "id",
  "name",
  "description",
  "summary",
  "price",
  "ratingAvg",
  "ratingCount",
];

type ProductFieldType = "string" | "number" | "boolean";
type BasicOperator = "equals" | "gte" | "gt" | "lte" | "lt";

interface ProductQueryResult {
  where: Prisma.ProductWhereInput;
  select?: Prisma.ProductSelect;
  orderBy: any;
  skip: number;
  take: number;
}

export class ProductFeatures extends QueryBuilder {
  private where: Prisma.ProductWhereInput = {};
  private select?: Prisma.ProductSelect;
  private static readonly BASIC_OPERATORS = new Set<BasicOperator>([
    "equals",
    "gte",
    "gt",
    "lte",
    "lt",
  ]);

  private static readonly FIELD_TYPES: Record<string, ProductFieldType> = {
    id: "string",
    name: "string",
    categoryId: "string",
    isHidden: "boolean",
    stock: "number",
    ratingAvg: "number",
    ratingCount: "number",
    soldQuantity: "number",
    price: "number",
  };

  constructor(query: QueryParams) {
    super(query);
    this.sort(PRODUCT_SORT_WHITELIST);
  }

  filter() {
    const queryObj = { ...this.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((field) => delete queryObj[field]);

    Object.entries(queryObj).forEach(([rawKey, rawValue]) => {
      const bracketMatch = rawKey.match(/^([a-zA-Z0-9_]+)\[([a-zA-Z]+)\]$/);
      if (bracketMatch) {
        const [, field, operator] = bracketMatch as [
          string,
          string,
          BasicOperator,
        ];

        if (PRODUCT_FILTER_WHITELIST.includes(field)) {
          this.setFieldFilter(field, operator, rawValue);
        }
        return;
      }

      if (!PRODUCT_FILTER_WHITELIST.includes(rawKey)) return;

      if (
        rawValue &&
        typeof rawValue === "object" &&
        !Array.isArray(rawValue)
      ) {
        Object.entries(rawValue).forEach(([operator, value]) => {
          this.setFieldFilter(rawKey, operator as BasicOperator, value);
        });
        return;
      }

      this.setFieldFilter(rawKey, undefined, rawValue);
    });

    return this;
  }

  limitFields() {
    if (!this.query.fields) {
      this.select = {
        id: true,
        name: true,
        summary: true,
        price: true,
        ratingAvg: true,
        ratingCount: true,
      };
      return this;
    }

    const fieldsParam = this.query.fields as string;
    const requestedFields = fieldsParam.split(",");

    const selectedFields: Prisma.ProductSelect = {};
    let hasValidField = false;

    requestedFields.forEach((field) => {
      const trimmedField = field.trim();
      if (PRODUCT_FIELDS_WHITELIST.includes(trimmedField)) {
        selectedFields[trimmedField as keyof Prisma.ProductSelect] = true;
        hasValidField = true;
      }
    });

    if (hasValidField) this.select = selectedFields;

    return this;
  }

  build(): ProductQueryResult {
    const baseResult = super.build();
    return {
      ...baseResult,
      where: this.where,
      select: this.select,
    };
  }

  private setFieldFilter(
    field: string,
    operator: BasicOperator | undefined,
    rawValue: unknown,
  ) {
    const type = ProductFeatures.FIELD_TYPES[field];
    if (!type) return;

    const value = this.coerceValue(type, rawValue);
    if (value === undefined) return;

    if (!operator) {
      if (field === "name") {
        (this.where as any)[field] = { contains: value, mode: "insensitive" };
      } else {
        (this.where as any)[field] = value;
      }
      return;
    }

    if (!ProductFeatures.BASIC_OPERATORS.has(operator)) return;
    if (type !== "number" && operator !== "equals") return;

    const existing = (this.where as any)[field];
    const normalizedExisting =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? existing
        : existing !== undefined
          ? { equals: existing }
          : {};

    (this.where as any)[field] = {
      ...normalizedExisting,
      [operator]: value,
    };
  }

  private coerceValue(
    type: ProductFieldType,
    rawValue: unknown,
  ): string | number | boolean | undefined {
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      return undefined;
    }

    const scalar = Array.isArray(rawValue) ? rawValue[0] : rawValue;

    if (type === "number") {
      const parsed = Number(scalar);
      return Number.isNaN(parsed) ? undefined : parsed;
    }

    if (type === "boolean") {
      if (scalar === true || scalar === "true") return true;
      if (scalar === false || scalar === "false") return false;
      return undefined;
    }

    return String(scalar);
  }
}
