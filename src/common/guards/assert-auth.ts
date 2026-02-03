import { Request } from "express";
import AppError from "../utils/appError";
import { AuthRequest } from "../types/auth-request";

export function assertAuth(req: Request): asserts req is AuthRequest {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }
}
