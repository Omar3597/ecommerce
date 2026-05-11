import { prisma } from "../../../lib/prisma";
import logger from "../../../config/logger";

export class CartCleanupService {
  private logger = logger.child({ module: "cart" });

  async cleanupStaleCarts(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedCarts = await prisma.cart.deleteMany({
        where: { updatedAt: { lt: sevenDaysAgo } },
      });

      this.logger.info(`Stale carts cleanup: ${deletedCarts.count} carts deleted`);
    } catch (err) {
      this.logger.error({ err },"Cart cleanup job failed");
      throw err;
    }
  }
}
