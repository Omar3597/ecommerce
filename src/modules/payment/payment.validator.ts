import { z } from "zod";

export const createPaymentSessionSchema = z.object({
  params: z
    .object({
      orderId: z.uuid("Invalid order ID"),
    })
    .strict(),
});

export type CreatePaymentSessionInput = z.infer<
  typeof createPaymentSessionSchema
>;
