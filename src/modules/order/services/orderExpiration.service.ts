import { Queue } from "bullmq";
import { OrderRepo } from "../repositories/order.repo";
import baseLogger from "../../../config/logger";
import { JOB_NAMES } from "../../../infra/queue";
import { ProductService } from "../../product";

export class OrderExpirationService {
  private logger = baseLogger.child({ module: "order" });

  constructor(
    private readonly emailQueue: Queue,
    private readonly orderRepo: OrderRepo = new OrderRepo(),
  ) {}

  async handleExpiredOrder({ orderId }: { orderId: string }) {
    return this.orderRepo.runInTransaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: { select: { id: true, email: true, name: true } },
        },
      });

      if (!order || order.status !== "PENDING") return;

      const updated = await tx.order.update({
        where: { id: orderId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });

      if (updated) {
        const productItems = order.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

        await ProductService.restoreStock(productItems, tx);

        this.logger.info(
          { action: "EXPIRE_ORDER", orderId },
          "Order expired and stock restored",
        );

        await this.emailQueue.add(JOB_NAMES.EMAIL.ORDER_CANCELLED, {
          orderId: order.id,
          userId: order.userId,
          email: order.user.email,
          name: order.user.name,
        });
      }
    });
  }
}
