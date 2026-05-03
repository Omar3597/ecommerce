import { User } from "@prisma/client";

declare module "express" {
  export interface Request {
    id: string;
    user?: User;
  }
}
