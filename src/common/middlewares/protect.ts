import { Request, Response, NextFunction } from "express";
import { getConfig } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../common/middlewares/catchAsync";
import AppError from "../../common/utils/appError";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

const config = getConfig();

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError(401, "Invalid token format"));
    }

    const token = authHeader.split(" ")[1];

    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      return next(new AppError(401, "Invalid or expired token"));
    }

    const user = await prisma.user.findFirst({
      where: {
        id: payload.id,
        isBanned: false,
        isDeleted: false,
        isVerified: true,
      },
    });

    if (!user) {
      return next(new AppError(401, "User no longer exists"));
    }

    if (user.passwordChangedAt) {
      const changedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000,
      );

      if (changedTimestamp > payload.iat) {
        return next(
          new AppError(401, "Password recently changed. Please login again."),
        );
      }
    }

    req.user = user;

    next();
  },
);
