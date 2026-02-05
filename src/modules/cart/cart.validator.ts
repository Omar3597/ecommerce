import { z } from "zod";

export const updateCartItemSchema = z.object({
  params: z.object({
    itemId: z.uuid("Invalid Cart Item ID"),
  }),
  body: z.object({
    quantity: z
      .number()
      .int("Quantity must be an integer")
      .positive("Quantity must be greater than 0"),
  }),
});

export const addProductToCartSchema = z.object({
  body: z.object({
    productId: z.uuid("Invalid product ID"),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    itemId: z.uuid(),
  }),
});
