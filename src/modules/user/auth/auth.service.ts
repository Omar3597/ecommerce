import bcrypt from "bcrypt";
import AppError from "../../../common/utils/appError";
import { SignupInput, LoginInput } from "./auth.dto";
import { prisma } from "../../../lib/prisma";
import { generateAccessToken, generateRefreshToken } from "./auth.tokens";

class AuthService {
  async signup(data: SignupInput) {
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

    // Set token expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token - update existing or create new
    await prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: { token: refreshToken, expiresAt },
      create: { userId: user.id, token: refreshToken, expiresAt },
    });

    // Return auth response
    return {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}
