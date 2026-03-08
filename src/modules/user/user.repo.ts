import { prisma } from "../../lib/prisma";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export class UserRepo {
  updateProfile(userId: string, name: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { name },
      select: userSelect,
    });
  }

  updatePasswordAndRevokeAllTokens(userId: string, hashedPassword: string) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId },
      }),
      prisma.shortToken.deleteMany({
        where: { userId },
      }),
    ]);
  }

  isEmailTaken(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  setPendingEmail(userId: string, pendingEmail: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { pendingEmail },
    });
  }

  findValidEmailChangeTokenForUser(hashedToken: string, userId: string) {
    return prisma.shortToken.findFirst({
      where: {
        token: hashedToken,
        type: "EMAIL_CHANGE",
        userId,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  updateEmailAndDeleteShortToken(
    userId: string,
    email: string,
    tokenId: string,
  ) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          email,
          pendingEmail: null,
        },
      }),
      prisma.shortToken.delete({
        where: { id: tokenId },
      }),
    ]);
  }
}
