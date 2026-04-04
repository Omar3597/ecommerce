import cron from "node-cron";
import { prisma } from "../../../lib/prisma";

const DELIVERY_AFTER_DAYS = 3;

export const runShippingSimulator = () => {
  // Every 8 hours
  cron.schedule("0 */8 * * *", async () => {
    try {
      await advanceToShipped();
      await advanceToDelivered();
    } catch (err) {
      console.error("Shipping simulator job failed", err);
    }
  });
};

/** PAID → SHIPPED: pick up all paid orders and mark them as shipped. */
async function advanceToShipped() {
  const result = await prisma.order.updateMany({
    where: { status: "PAID" },
    data: { status: "SHIPPED" },
  });

  console.log(`Shipping simulator: ${result.count} order(s) marked as SHIPPED`);
}

/** SHIPPED → DELIVERED: deliver orders whose creation date is ≥ 3 days ago. */
async function advanceToDelivered() {
  const deliveryThreshold = new Date();
  deliveryThreshold.setDate(deliveryThreshold.getDate() - DELIVERY_AFTER_DAYS);

  const result = await prisma.order.updateMany({
    where: {
      status: "SHIPPED",
      createdAt: { lte: deliveryThreshold },
    },
    data: { status: "DELIVERED" },
  });

  console.log(`Shipping simulator: ${result.count} order(s) marked as DELIVERED`);
}
