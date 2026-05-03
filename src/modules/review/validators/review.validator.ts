import { z } from "zod";

const reviewIdParamsSchema = z.object({
  reviewId: z.uuid("Invalid review ID"),
});

const productIdParamsSchema = z.object({
  productId: z.uuid("Invalid product ID"),
});

const ratingSchema = z
  .number("Rating is required")
  .int("Rating must be an integer")
  .min(1, "Rating must be at least 1")
  .max(5, "Rating must be at most 5");

const commentSchema = z
  .string("Comment must be a string")
  .trim()
  .min(3, "Comment must be at least 3 characters")
  .max(1000, "Comment must be at most 1000 characters");

export const createReviewSchema = z.object({
  params: productIdParamsSchema,
  body: z
    .object({
      rating: ratingSchema,
      comment: commentSchema.optional(),
    })
    .strict(),
});

const updateReviewBodySchema = z
  .object({
    rating: ratingSchema.optional(),
    comment: commentSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update review",
  });

export const updateReviewSchema = z.object({
  params: reviewIdParamsSchema,
  body: updateReviewBodySchema,
});

export const getReviewSchema = z.object({
  params: reviewIdParamsSchema,
});

export const deleteReviewSchema = z.object({
  params: reviewIdParamsSchema,
});

export const getProductReviewsSchema = z.object({
  params: z.object({
    productId: z.uuid("Invalid product ID"),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>["body"];
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>["body"];
