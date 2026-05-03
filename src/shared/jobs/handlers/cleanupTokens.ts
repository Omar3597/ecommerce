import cron from "node-cron";
import { prisma } from "../../../lib/prisma";

export const cleanupExpiredTokens = () => {
  // Every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      const now = new Date();

      const deletedShort = await prisma.shortToken.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      const deletedRefresh = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      console.log(
        `Expired tokens cleanup: ${deletedShort.count} short tokens, ${deletedRefresh.count} refresh tokens`
      );
    } catch (err) {
      console.error("Token cleanup job failed", err);
    }
  });
};
