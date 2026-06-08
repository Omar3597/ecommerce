import { prisma } from "../../../lib/prisma";
import logger from "../../../config/logger";

export class TokensCleanupService {
  private logger = logger.child({ module: "auth" });

  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();

      const deletedRefresh = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      this.logger.info(
        `Expired tokens cleanup: ${deletedRefresh.count} refresh tokens`,
      );
    } catch (err) {
      this.logger.error({ err }, "Token cleanup job failed");
      throw err;
    }
  }
}
