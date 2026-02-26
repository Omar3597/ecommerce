import cron from "node-cron";
import { prisma } from "../../lib/prisma";

export const orderExpirationJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const expiredOrders = await prisma.order.findMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: new Date() },
        },
        include: { items: true },
      });

      for (const order of expiredOrders) {
        await prisma.$transaction(async (tx) => {
          const updated = await tx.order.updateMany({
            where: {
              id: order.id,
              status: "PENDING",
            },
            data: { status: "CANCELLED" },
          });

          if (updated.count === 0) return;

          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                soldQuantity: { decrement: item.quantity },
              },
            });
          }
        });
      }

      console.log(`Expired orders processed: ${expiredOrders.length}`);
    } catch (err) {
      console.error("Order expiration job failed", err);
    }
  });
};
