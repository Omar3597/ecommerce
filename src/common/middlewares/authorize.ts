import { Request, Response, NextFunction } from "express";
import {
  permissions,
  type Resource,
  type Action,
} from "../../config/authorization/permissions";
import AppError from "../utils/appError";

export const authorize =
  (resource: Resource, action: Action) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new Error("User is not authenticated"));
    }

    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) {
      return next(new Error("No permissions defined"));
    }

    const allowedRoles = resourcePermissions[action];

    if (!allowedRoles) {
      return next(new AppError(403, "Action is not allowed"));
    }

    if (allowedRoles === "*") {
      return next();
    }

    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return next(
        new AppError(403, "You donnot have access for this permission"),
      );
    }

    next();
  };
