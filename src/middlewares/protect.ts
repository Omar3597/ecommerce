import { Request, Response, NextFunction } from "express";
import { getConfig } from "../config/env";
import { prisma } from "../lib/prisma";
import { catchAsync } from "./catchAsync";
import AppError from "../shared/errors/appError";
import cacheService from "../shared/services/cache.service";
import jwt from "jsonwebtoken";
import logger from "../config/logger";
import type { User } from "@prisma/client";

interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

const AUTH_USER_CACHE_TTL = 5 * 60; //  5 minutes in seconds

const authUserCacheKey = (userId: string) => `auth:user:${userId}`;

const config = getConfig();

function extractBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Invalid token format");
  }

  return authHeader.split(" ")[1];
}

function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
}

async function fetchAuthUser(userId: string): Promise<User | null> {
  const user = await cacheService.wrap<User | null>(
    authUserCacheKey(userId),
    AUTH_USER_CACHE_TTL,
    () =>
      prisma.user.findFirst({
        where: {
          id: userId,
          isBanned: false,
          isDeleted: false,
          isVerified: true,
        },
      }),
  );

  // JSON.stringify/parse loses Date types — restore after a cache hit
  if (user?.passwordChangedAt) {
    user.passwordChangedAt = new Date(user.passwordChangedAt);
  }

  return user;
}

function wasPasswordChangedAfterToken(user: User, tokenIat: number): boolean {
  if (!user.passwordChangedAt) return false;

  const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
  return changedTimestamp > tokenIat;
}

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    const payload = verifyAccessToken(token);

    const user = await fetchAuthUser(payload.id);

    if (!user) {
      logger.warn(
        { userId: payload.id },
        "User associated with token not found or inactive",
      );
      return next(new AppError(401, "User no longer exists"));
    }

    if (wasPasswordChangedAfterToken(user, payload.iat)) {
      logger.warn(
        { userId: payload.id },
        "User associated with token has changed password",
      );
      return next(
        new AppError(401, "Password recently changed. Please login again."),
      );
    }

    req.user = user;
    next();
  },
);
