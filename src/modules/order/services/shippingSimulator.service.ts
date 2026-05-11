import { prisma } from "../../../lib/prisma";
import baseLogger from "../../../config/logger";

const DELIVERY_AFTER_DAYS = 3;

export class ShippingSimulatorService {
  private logger = baseLogger.child({ module: "order" });

  public async simulate() {
    try {
      await this.advanceToShipped();
      await this.advanceToDelivered();
    } catch (err) {
      this.logger.error({ err }, "Shipping simulator job failed");
    }
  }

  private async advanceToShipped() {
    const result = await prisma.order.updateMany({
      where: { status: "PAID" },
      data: { status: "SHIPPED" },
    });

    this.logger.info(
      `Shipping simulator: ${result.count} order(s) marked as SHIPPED`,
    );
  }

  private async advanceToDelivered() {
    const deliveryThreshold = new Date();
    deliveryThreshold.setDate(
      deliveryThreshold.getDate() - DELIVERY_AFTER_DAYS,
    );

    const result = await prisma.order.updateMany({
      where: {
        status: "SHIPPED",
        createdAt: { lte: deliveryThreshold },
      },
      data: { status: "DELIVERED" },
    });

    this.logger.info(
      `Shipping simulator: ${result.count} order(s) marked as DELIVERED`,
    );
  }
}
