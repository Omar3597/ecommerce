import { z } from "zod";

const addressIdParamsSchema = z.object({
  addressId: z.uuid("Invalid address ID"),
});

const fullNameSchema = z
  .string("Full name is required")
  .trim()
  .min(3, "Full name must be at least 3 characters")
  .max(100, "Full name must be at most 100 characters");

const phoneSchema = z
  .string("Phone is required")
  .trim()
  .min(7, "Phone must be at least 7 characters")
  .max(30, "Phone must be at most 30 characters")
  .refine((value) => /^[+]?[\d\s\-()]+$/.test(value), {
    message: "Phone contains invalid characters",
  })
  .refine((value) => (value.match(/\d/g) || []).length >= 7, {
    message: "Phone must contain at least 7 digits",
  });

const citySchema = z
  .string("City is required")
  .trim()
  .min(2, "City must be at least 2 characters")
  .max(100, "City must be at most 100 characters");

const streetSchema = z
  .string("Street is required")
  .trim()
  .min(3, "Street must be at least 3 characters")
  .max(200, "Street must be at most 200 characters");

const buildingSchema = z
  .string("Building must be a string")
  .trim()
  .min(1, "Building must be at least 1 character")
  .max(100, "Building must be at most 100 characters");

export const createAddressSchema = z.object({
  body: z
    .object({
      fullName: fullNameSchema,
      phone: phoneSchema,
      city: citySchema,
      street: streetSchema,
      building: buildingSchema.optional(),
    })
    .strict(),
});

const updateAddressBodySchema = z
  .object({
    fullName: fullNameSchema.optional(),
    phone: phoneSchema.optional(),
    city: citySchema.optional(),
    street: streetSchema.optional(),
    building: buildingSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update address",
  });

export const getAddressSchema = z.object({
  params: addressIdParamsSchema,
});

export const updateAddressSchema = z.object({
  params: addressIdParamsSchema,
  body: updateAddressBodySchema,
});

export const deleteAddressSchema = z.object({
  params: addressIdParamsSchema,
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>["body"];
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>["body"];
