import { Request, Response, NextFunction } from "express";
import {
  permissions,
  type Resource,
  type Action,
} from "../../config/authorization/permissions";
import AppError from "../utils/appError";
import logger from "../../config/logger";

export const authorize =
  (resource: Resource, action: Action) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn(
        { action: `${action.toUpperCase()}_${resource.toUpperCase()}` },
        "Authorization failed: User is not authenticated",
      );
      return next(new Error("User is not authenticated"));
    }

    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) {
      logger.error(
        {
          action: `${action.toUpperCase()}_${resource.toUpperCase()}`,
          userId: req.user.id,
          role: req.user.role,
        },
        "Authorization failed: No permissions defined for this resource",
      );
      return next(new Error("No permissions defined"));
    }

    const allowedRoles = resourcePermissions[action];

    if (!allowedRoles) {
      logger.warn(
        {
          action: `${action.toUpperCase()}_${resource.toUpperCase()}`,
          userId: req.user.id,
          role: req.user.role,
        },
        "Authorization failed: Action is not defined/allowed for this resource",
      );
      return next(new AppError(403, "Action is not allowed"));
    }

    if (allowedRoles === "*") {
      logger.info(
        {
          action: `${action.toUpperCase()}_${resource.toUpperCase()}`,
          userId: req.user.id,
          role: req.user.role,
        },
        "Authorization granted: Wildcard access",
      );
      return next();
    }

    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      logger.warn(
        {
          action: `${action.toUpperCase()}_${resource.toUpperCase()}`,
          userId: req.user.id,
          role: req.user.role,
          allowedRoles,
        },
        "Authorization failed: Role does not have the required permission",
      );
      return next(
        new AppError(403, "You donnot have access for this permission"),
      );
    }

    logger.info(
      {
        action: `${action.toUpperCase()}_${resource.toUpperCase()}`,
        userId: req.user.id,
        role: req.user.role,
      },
      "Authorization granted",
    );
    next();
  };
