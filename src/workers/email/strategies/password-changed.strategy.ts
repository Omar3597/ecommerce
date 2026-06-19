import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { UserPasswordChangedPayload } from "../../../events/event.types";

export class PasswordChangedEmailStrategy implements IEmailStrategy {
  constructor(private emailService: EmailService) {}

  async execute(job: Job<UserPasswordChangedPayload>): Promise<void> {
    console.log("Executing PasswordChangedEmailStrategy ...");
    const { name, email } = job.data;
    await this.emailService.sendPasswordChanged({
      name,
      email,
      changedAt: new Date().toLocaleString(),
      supportUrl: "support@ecommerce.com",
    });
  }
}
