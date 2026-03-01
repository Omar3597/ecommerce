import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import AppError from "../../common/utils/appError";
import {
  requestEmailChangeInput,
  updateProfileInput,
  updatePasswordInput,
  verifyEmailChangeInput,
} from "./user.validator";
import { User } from "../../../generated/prisma/client";
import crypto from "crypto";
import { AuthTokenEmailUseCase, EmailTokenType } from "../auth/auth.usecase";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

export class UserService {
  async updateProfile(user: User, data: updateProfileInput) {
    if (data.name === user.name) {
      throw new AppError(400, "Name is already up to date");
    }

    return prisma.user.update({
      where: { id: user.id },
      data: { name: data.name },
      select: userSelect,
    });
  }

  async updatePassword(user: User, data: updatePasswordInput) {
    const { currentPassword, newPassword } = data;

    const validCurrentPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!validCurrentPassword) {
      throw new AppError(401, "Invalid current password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      }),
      prisma.refreshToken.delete({
        where: { userId: user.id },
      }),
    ]);
  }

  async requestEmailChange(user: User, data: requestEmailChangeInput) {
    if (data.email === user.email) {
      throw new AppError(400, "New email must be different from current email");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id: { not: user.id },
        OR: [{ email: data.email }, { pendingEmail: data.email }],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError(400, "Email already in use");
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { pendingEmail: data.email },
    });

    await prisma.shortToken.deleteMany({
      where: { userId: user.id, type: "EMAIL_CHANGE" },
    });

    new AuthTokenEmailUseCase(prisma)
      .send({ ...updatedUser, email: data.email }, EmailTokenType.EMAIL_CHANGE)
      .catch((err) => console.error(`somthing went wrong: ${err}`));
  }

  async verifyEmailChange(user: User, data: verifyEmailChangeInput) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(data.token)
      .digest("hex");

    const storedToken = await prisma.shortToken.findFirst({
      where: {
        token: hashedToken,
        type: "EMAIL_CHANGE",
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError(400, "Token is invalid or has expired");
    }

    const pendingEmail = storedToken.user.pendingEmail?.trim().toLowerCase();
    if (!pendingEmail) {
      throw new AppError(400, "No pending email change request found");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id: { not: user.id },
        OR: [{ email: pendingEmail }, { pendingEmail }],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError(400, "Email already in use");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          email: pendingEmail,
          pendingEmail: null,
        },
      }),
      prisma.shortToken.delete({
        where: { id: storedToken.id },
      }),
    ]);
  }
}
