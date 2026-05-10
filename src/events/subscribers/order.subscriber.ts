import { Queue } from "bullmq";
import { IEventBus } from "../../infra/event-bus";
import { EVENT_NAMES } from "../event.constants";
import { JOB_NAMES } from "../../infra/queue";
import { OrderCreatedPayload, OrderCancelledPayload } from "../event.types";

export class OrderSubscriber {
  constructor(
    private eventBus: IEventBus,
    private orderQueue: Queue,
    private emailQueue: Queue,
  ) {}

  public register(): void {
    this.eventBus.on(
      EVENT_NAMES.ORDER.CREATED,
      async (payload: OrderCreatedPayload) => {
        await this.orderQueue.add(
          JOB_NAMES.ORDER.EXPIRE,
          { orderId: payload.orderId },
          { delay: 15 * 60 * 1000 },
        );
      },
    );

    this.eventBus.on(
      EVENT_NAMES.ORDER.CANCELLED,
      async (payload: OrderCancelledPayload) => {
        await this.emailQueue.add(JOB_NAMES.EMAIL.ORDER_CANCELLED, payload);
      },
    );
  }
}
