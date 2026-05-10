import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { PaymentCompletedPayload } from "../../../events/event.types";

export class InvoiceEmailStrategy implements IEmailStrategy {
  constructor(private emailService: EmailService) {}

  async execute(job: Job<PaymentCompletedPayload>): Promise<void> {
    console.log("Executing InvoiceEmailStrategy ...");
    await this.emailService.sendInvoice(job.data);
  }
}
