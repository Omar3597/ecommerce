import jwt from "jsonwebtoken";
import { getConfig } from "../../../config/config";
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
