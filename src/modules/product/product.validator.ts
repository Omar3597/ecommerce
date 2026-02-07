import { z } from "zod";

export const getProductSchema = z.object({
  params: z.object({
    productId: z.uuid("Invalid product ID"),
  }),
});

const nameSchema = z
  .string("Name is required")
  .trim()
  .min(3, "Name must be at least 3 characters")
  .max(100, "Name must be at most 100 characters");

const summarySchema = z
  .string("Summary is required")
  .trim()
  .min(10, "Summary must be at least 10 characters")
  .max(200, "Summary must be at most 200 characters");

const descriptionSchema = z
  .string("Description must be a string")
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(1500, "Description must be at most 1500 characters");

const priceSchema = z
  .union([
    z.number("Price must be a number"),
    z.string("Price must be a string"),
  ])
  .transform((value) =>
    typeof value === "number" ? String(value) : value.trim(),
  )
  .refine((value) => /^([1-9]\d{0,7}|0)(\.\d{1,2})?$/.test(value), {
    message:
      "Price must be a valid decimal number with up to 8 integer digits and 2 decimal places",
  })
  .transform((value) => Number(value))
  .refine((value) => Number.isFinite(value) && value > 0, {
    message: "Price must be greater than 0",
  });

const stockSchema = z
  .number("Stock is required")
  .int("Stock must be an integer")
  .min(0, "Stock must be greater than or equal to 0")
  .max(1000000, "Stock is too large");

export const createProductSchema = z.object({
  body: z
    .object({
      name: nameSchema,
      summary: summarySchema,
      description: descriptionSchema.optional(),
      price: priceSchema,
      stock: stockSchema.default(1),
      categoryId: z.uuid("Invalid category ID"),
      isHidden: z.boolean("isHidden must be a boolean").optional(),
    })
    .strict(),
});

const updateProductBodySchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    summary: summarySchema.optional(),
    price: priceSchema.optional(),
    stock: stockSchema.optional(),
    isHidden: z.boolean("isHidden must be a boolean").optional(),
    categoryId: z.uuid("Invalid category ID").optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update product",
  });

export const updateProductSchema = z.object({
  params: z.object({
    productId: z.uuid("Invalid product ID"),
  }),
  body: updateProductBodySchema,
});

export const deleteProductSchema = z.object({
  params: z.object({
    productId: z.uuid("Invalid product ID"),
  }),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
