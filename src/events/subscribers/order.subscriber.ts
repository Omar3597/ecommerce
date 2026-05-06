import { Queue } from "bullmq";
import { IEventBus } from "../../infra/event-bus";
import { EVENT_NAMES } from "../event.constants";
import { JOB_NAMES } from "../../infra/queue";
import { OrderCreatedPayload } from "../event.types";

export class OrderSubscriber {
  constructor(
    private eventBus: IEventBus,
    private orderQueue: Queue,
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
  }
}
