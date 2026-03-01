import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.enum(["USER", "ADMIN", "MANAGER"]),
  password: z.string(),
  isDeleted: z.boolean(),
  createdAt: z.date(),
});

export const PublicUserDto = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  role: true,
});
