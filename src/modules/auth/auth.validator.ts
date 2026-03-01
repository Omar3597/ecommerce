import { z } from "zod";
import validator from "validator";

const strongPassword = (value: string): boolean => {
  return validator.isStrongPassword(value, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });
};

export const passwordSchema = z
  .string("password is required")
  .min(8, "Password must be at least 8 characters")
  .refine(strongPassword, {
    message:
      "Password must contain at least: 1 uppercase, 1 lowercase, 1 number, and 1 symbol",
  });

const confirmPassword = (data: any, ctx: z.RefinementCtx) => {
  if (data.passwordConfirm !== data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["passwordConfirm"],
    });
  }
};

export const signupSchema = z.object({
  body: z
    .object({
      name: z
        .string("Name is required")
        .trim()
        .min(3, "Name must be at least 3 characters")
        .max(50),
      email: z
        .string("Email is required")
        .email("Invalid email address")
        .transform((v) => v.toLowerCase()),
      password: passwordSchema,
      passwordConfirm: z.string("Password confirmation is required"),
    })
    .required()
    .superRefine(confirmPassword),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string("Email is required")
        .email("Invalid email address")
        .transform((v) => v.toLowerCase()),
      password: z.string("Password is required").min(1, "Password is required"),
    })
    .required(),
});

export const forgotPasswordSchema = z.object({
  body: z
    .object({
      email: z
        .string("Email is required")
        .email("Invalid email address")
        .transform((v) => v.toLowerCase()),
    })
    .required(),
});

export const passwordResetSchema = z.object({
  params: z
    .object({
      token: z.string("Token is required").length(64),
    })
    .required(),
  body: z
    .object({
      password: passwordSchema,
      passwordConfirm: z.string("Password confirmation is required"),
    })
    .required()
    .superRefine(confirmPassword),
});

export const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string("Token is required").length(64),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type forgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type passwordResetInput = z.infer<typeof passwordResetSchema>;
