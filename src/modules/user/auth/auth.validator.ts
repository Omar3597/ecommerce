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
  .string()
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

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Password confirmation is required"),
  })
  .required()
  .superRefine(confirmPassword);

export const loginSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
  .required();

export const forgotPasswordSchema = z
  .object({
    email: z.string().email("Invalid email address"),
  })
  .required();

export const reactivateUserSchema = z
  .object({
    email: z.string().email("Invalid email address"),
  })
  .required();

export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Password confirmation is required"),
  })
  .required()
  .superRefine(confirmPassword);

export const sensitiveActionSchema = z.object({
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type forgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type passwordResetInput = z.infer<typeof passwordResetSchema>;
