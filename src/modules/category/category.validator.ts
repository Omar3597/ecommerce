import { z } from "zod";

export const getCategorySchema = z.object({
  params: z.object({
    categoryId: z.uuid("Invalid category ID"),
  }),
});

const nameSchema = z
  .string("Name is required")
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters");

const slugSchema = z
  .string("Slug must be a string")
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .max(120, "Slug must be at most 120 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case");

export const createCategorySchema = z.object({
  body: z
    .object({
      name: nameSchema,
      slug: slugSchema.optional(),
      isHidden: z.boolean("isHidden must be a boolean").optional(),
    })
    .strict(),
});

const updateCategoryBodySchema = z
  .object({
    name: nameSchema.optional(),
    slug: slugSchema.optional(),
    isHidden: z.boolean("isHidden must be a boolean").optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update category",
  });

export const updateCategorySchema = z.object({
  params: z.object({
    categoryId: z.uuid("Invalid category ID"),
  }),
  body: updateCategoryBodySchema,
});

export const deleteCategorySchema = z.object({
  params: z.object({
    categoryId: z.uuid("Invalid category ID"),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>["body"];
