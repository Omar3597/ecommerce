import { z } from "zod";

export const getProductSchema = z.object({
  params: z.object({
    productId: z.uuid("Invalid product ID"),
  }),
});
