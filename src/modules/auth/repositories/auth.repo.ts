import { prisma } from "../../../lib/prisma";
import { SignupInput } from "../validators/auth.validator";

export class AuthRepo {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  createUser(data: SignupInput, hashedPassword: string) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });
  }

  createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  findValidRefreshToken(token: string) {
    return prisma.refreshToken.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  }

  rotateRefreshToken({
    hashedOldToken,
    hashedNewToken,
    expiresAt,
    userId,
  }: {
    hashedOldToken: string;
    hashedNewToken: string;
    expiresAt: Date;
    userId: string;
  }) {
    return prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { token: hashedOldToken } }),
      prisma.refreshToken.create({
        data: { userId, token: hashedNewToken, expiresAt },
      }),
    ]);
  }

  deleteRefreshTokenByToken(token: string) {
    return prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  deleteRefreshTokenByUserId(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  findActiveUserForPasswordReset(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        isBanned: false,
        isDeleted: false,
        isVerified: true,
      },
    });
  }

  resetPasswordAndRevokeTokens(userId: string, hashedPassword: string) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId },
      }),
    ]);
  }

  verifyUserEmail(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }

  countSessionsByUserId(userId: string) {
    return prisma.refreshToken.count({ where: { userId } });
  }

  async deleteOldestSession(userId: string) {
    const oldest = await prisma.refreshToken.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (oldest) {
      return prisma.refreshToken.delete({
        where: { id: oldest.id },
      });
    }
  }
}
