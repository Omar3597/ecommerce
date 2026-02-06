import { z } from "zod";
import { passwordSchema } from "./auth/auth.validator";

const comparePasswords = (data: any, ctx: z.RefinementCtx) => {
  if (data.currentPassword === data.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New password must be different",
      path: ["newPassword"],
    });
  }

  if (data.newPasswordConfirm !== data.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["newPasswordConfirm"],
    });
  }
};

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string("Name is required")
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50),
  }),
});

export const updatePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: passwordSchema,
      newPassword: passwordSchema,
      newPasswordConfirm: z.string("New password confirmation is required"),
    })
    .required()
    .superRefine(comparePasswords),
});

export const requestEmailChangeSchema = z.object({
  body: z
    .object({
      email: z
        .string("Email is required")
        .email("Invalid email address")
        .transform((v) => v.toLowerCase()),
    })
    .required(),
});

export const verifyEmailChangeSchema = z.object({
  params: z
    .object({
      token: z.string("Token is required").length(64),
    })
    .required(),
});

export type updateProfileInput = z.infer<typeof updateProfileSchema>["body"];
export type updatePasswordInput = z.infer<typeof updatePasswordSchema>["body"];
export type requestEmailChangeInput = z.infer<
  typeof requestEmailChangeSchema
>["body"];
export type verifyEmailChangeInput = z.infer<
  typeof verifyEmailChangeSchema
>["params"];
