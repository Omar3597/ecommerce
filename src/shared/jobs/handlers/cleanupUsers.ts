import cron from "node-cron";
import { prisma } from "../../../lib/prisma";

export const cleanupUnverifiedUsers = () => {
  // Every 12 hours
  cron.schedule("0 */12 * * *", async () => {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const deletedUsers = await prisma.user.deleteMany({
        where: {
          isVerified: false,
          createdAt: { lt: oneDayAgo },
        },
      });

      console.log(`Unverified users cleanup: ${deletedUsers.count} users deleted`);
    } catch (err) {
      console.error("User cleanup job failed", err);
    }
  });
};
