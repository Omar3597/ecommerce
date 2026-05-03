import { Request } from "express";
import AppError from "../errors/appError";
import { AuthRequest } from "../types/auth.types";

export function assertAuth(req: Request): asserts req is AuthRequest {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }
}
