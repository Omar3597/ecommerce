import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { OrderCancelledPayload } from "../../../events/event.types";

export class OrderCancelledEmailStrategy implements IEmailStrategy {
  constructor(private emailService: EmailService) {}

  async execute(job: Job<OrderCancelledPayload>): Promise<void> {
    await this.emailService.sendOrderCancelled(job.data);
  }
}
