import { Queue } from "bullmq";
import { IEventBus } from "../../infra/event-bus";
import { EVENT_NAMES } from "../event.constants";
import { JOB_NAMES } from "../../infra/queue";
import { PaymentCompletedPayload } from "../event.types";

export class PaymentSubscriber {
  constructor(
    private eventBus: IEventBus,
    private emailQueue: Queue,
  ) {}

  public register(): void {
    this.eventBus.on(
      EVENT_NAMES.PAYMENT.COMPLETED,
      (payload: PaymentCompletedPayload) => {
        this.emailQueue.add(JOB_NAMES.EMAIL.INVOICE, payload);
      },
    );
  }
}
