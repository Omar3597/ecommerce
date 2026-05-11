import { prisma } from "../../../lib/prisma";
import logger from "../../../config/logger";

export class UserCleanupService {
  private logger = logger.child({ module: "user" });

  async cleanupUnverifiedUsers(): Promise<void> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const deletedUsers = await prisma.user.deleteMany({
        where: {
          isVerified: false,
          createdAt: { lt: oneDayAgo },
        },
      });

      this.logger.info(`Unverified users cleanup: ${deletedUsers.count} users deleted`);
    } catch (err) {
      this.logger.error({ err }, "User cleanup job failed");
      throw err;
    }
  }
}
