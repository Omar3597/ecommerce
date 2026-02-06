import { z } from "zod";

export const PublicUserDto = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.enum(["USER", "ADMIN", "MANAGER"]),
});
