import cron from "node-cron";
import { prisma } from "../../../lib/prisma";

export const cleanupStaleCarts = () => {
  // Every 4 days
  cron.schedule("0 0 */4 * *", async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedCarts = await prisma.cart.deleteMany({
        where: { updatedAt: { lt: sevenDaysAgo } },
      });

      console.log(`Stale carts cleanup: ${deletedCarts.count} carts deleted`);
    } catch (err) {
      console.error("Cart cleanup job failed", err);
    }
  });
};
