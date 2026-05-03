import { Request } from "express";
import { User } from "@prisma/client";
import AppError from "../utils/appError";

interface AuthRequest extends Request {
  user: User;
}

export function assertAuth(req: Request): asserts req is AuthRequest {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }
}
