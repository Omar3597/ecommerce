import { Queue } from "bullmq";
import { IEventBus } from "../../infra/event-bus";
import { EVENT_NAMES } from "../event.constants";
import { JOB_NAMES } from "../../infra/queue";
import {
  ProductImageRemovedPayload,
  ProductDeletedPayload,
} from "../event.types";

export class ProductSubscriber {
  constructor(
    private eventBus: IEventBus,
    private imageQueue: Queue,
  ) {}

  public register(): void {
    this.eventBus.on(
      EVENT_NAMES.PRODUCT.IMAGE_REMOVED,
      async (payload: ProductImageRemovedPayload) => {
        await this.imageQueue.add(JOB_NAMES.IMAGE.DELETE, payload);
      },
    );

    this.eventBus.on(
      EVENT_NAMES.PRODUCT.DELETED,
      async (payload: ProductDeletedPayload) => {
        await this.imageQueue.add(JOB_NAMES.IMAGE.BULK_DELETE, payload);
      },
    );
  }
}
