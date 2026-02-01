import bcrypt from "bcrypt";
import AppError from "../../../common/utils/appError";
import { SignupInput, LoginInput, forgotPassword } from "./auth.dto";
import { prisma } from "../../../lib/prisma";
import { generateAccessToken, generateRefreshToken } from "./auth.tokens";
import crypto from "crypto";
import { getConfig } from "../../../config/config";
import { AuthTokenEmailUseCase, EmailTokenType } from "./auth.usecase";
import { PrismaClient } from "../../../../generated/prisma/client";

const config = getConfig();

export class AuthService {
  private buildAuthUser(user: { id: string; name: string; role: string }) {
    return {
      id: user.id,
      name: user.name,
      role: user.role,
    };
  }

  private hashRefreshToken(refreshToken: string) {
    return crypto
      .createHmac("sha256", config.refreshSecret)
      .update(refreshToken)
      .digest("hex");
  }

  private getRefreshTokenExpiryDate(days = 7) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  async registerUser(data: SignupInput) {
    // 1. check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      if (existingUser.isBanned) {
        throw new AppError(
          403,
          "This account has been banned by admin. You cannot use this email again.",
        );
      }
      if (existingUser.isDeleted) {
        throw new AppError(
          409,
          "This account was previously deleted by you. Would you like to reactivate it?",
        );
      }

      throw new AppError(400, "Email already in use");
    }

    // 2. hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 3. create user
    const { name, email } = data;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return newUser;
  }

  async loginWithEmailAndPassword(data: LoginInput) {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    // Security: Prevent user enumeration by always running password comparison
    if (!user || user.isDeleted || user.isBanned) {
      await bcrypt.compare(data.password, "$2b$12$invalidhash"); // Dummy comparison
      throw new AppError(401, "Invalid email or password");
    }

    // Verify password
    const matchPasswords = await bcrypt.compare(data.password, user.password);
    if (!matchPasswords) {
      throw new AppError(401, "Invalid email or password");
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken();

    const hashedRefreshToken = this.hashRefreshToken(refreshToken);

    // Set token expiration (7 days)
    const expiresAt = this.getRefreshTokenExpiryDate();

    // Store refresh token - update existing or create new
    await prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: { token: hashedRefreshToken, expiresAt },
      create: { userId: user.id, token: hashedRefreshToken, expiresAt },
    });

    // Return auth response
    return {
      user: this.buildAuthUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string | undefined) {
    // 1. Check if refresh token is provided
    if (!refreshToken || refreshToken.trim() === "") {
      throw new AppError(401, "Refresh token is required");
    }

    // 2. Find the refresh token in database
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashedRefreshToken, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    // 3. Check if token exists
    if (!storedToken) {
      throw new AppError(401, "Invalid refresh token");
    }

    // 5. Check if user still exists and is active
    if (
      !storedToken.user ||
      storedToken.user.isBanned ||
      storedToken.user.isDeleted
    ) {
      await prisma.refreshToken.delete({
        where: { token: hashedRefreshToken },
      });
      throw new AppError(401, "user account no longer exists");
    }

    // 8. Generate new access token
    const accessToken = generateAccessToken(
      storedToken.user.id,
      storedToken.user.role,
    );

    return {
      user: this.buildAuthUser(storedToken.user),
      accessToken,
    };
  }
}
