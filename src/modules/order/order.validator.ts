import { z } from "zod";

export const createOrderSchema = z.object({
  body: z
    .object({
      addressId: z.uuid("Invalid address ID"),
    })
    .strict(),
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    orderId: z.uuid("Invalid order ID"),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>["body"];
