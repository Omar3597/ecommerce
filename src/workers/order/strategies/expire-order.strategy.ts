import { Job } from "bullmq";
import { IOrderStrategy } from "../order.strategy.interface";
import { OrderExpirePayload } from "../../../events/event.types";
import { OrderExpirationService } from "../../../modules/order";

export class ExpireOrderStrategy implements IOrderStrategy {
  constructor(private orderExpirationService: OrderExpirationService) {}

  async execute(job: Job<OrderExpirePayload>): Promise<void> {
    console.log("Executing ExpireOrderStrategy ...");
    await this.orderExpirationService.handleExpiredOrder(job.data.orderId);
  }
}
