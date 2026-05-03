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
  .number("Price is required")
  .int("Price must be an integer amount in cents")
  .positive("Price must be greater than 0 cents")
  .max(999_999, "Price is too large");

const stockSchema = z
  .number("Stock is required")
  .int("Stock must be an integer")
  .min(0, "Stock must be greater than or equal to 0")
  .max(99_999, "Stock is too large");

const productImageSchema = z.object({
  url: z.string().url("Image url must be a valid URL"),
  publicId: z.string().min(1, "Image publicId is required"),
  sortOrder: z
    .number("sortOrder must be a number")
    .int("sortOrder must be an integer")
    .min(0, "sortOrder must be 0 or greater"),
});

const productImagesArraySchema = z
  .array(productImageSchema)
  .max(3, "A product can have at most 3 images")
  .refine(
    (imgs) => new Set(imgs.map((i) => i.sortOrder)).size === imgs.length,
    { message: "Each image must have a unique sortOrder" },
  );

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
      images: productImagesArraySchema.min(1, "At least one image is required"),
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
    images: productImagesArraySchema.optional(),
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

export const deleteImageSchema = z.object({
  params: z.object({
    publicId: z.string().min(1, "Public ID is required"),
  }),
});

export const uploadImagesSchema = z.object({
  files: z
    .any()
    .refine(
      (files) => Array.isArray(files) && files.length > 0,
      "Please upload at least one image.",
    )
    .refine(
      (files) => Array.isArray(files) && files.length <= 3,
      "You can upload a maximum of 3 images at a time.",
    ),
});

export type ProductImageInput = z.infer<typeof productImageSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
