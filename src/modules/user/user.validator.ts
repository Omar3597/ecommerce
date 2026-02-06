import { z } from "zod";
import { passwordSchema } from "./auth/auth.validator";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string("Name is required")
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50),
  }),
});

export type updateProfileInput = z.infer<typeof updateProfileSchema>["body"];
