import jwt from "jsonwebtoken";
import { getConfig } from "../../config/env";
import crypto from "crypto";

const config = getConfig();

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, config.jwtSecret, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString("hex");
};

export const hashRefreshToken = (refreshToken: string) => {
  return crypto
    .createHmac("sha256", config.refreshSecret)
    .update(refreshToken)
    .digest("hex");
};

export const getRefreshTokenExpiryDate = (days = 7) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
};
