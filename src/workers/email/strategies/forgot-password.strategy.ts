import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { UserForgotPasswordPayload } from "../../../events/event.types";

export class ForgotPasswordEmailStrategy implements IEmailStrategy {
  constructor(private emailService: EmailService) {}

  async execute(job: Job<UserForgotPasswordPayload>): Promise<void> {
    await this.emailService.sendForgotPassword(job.data);
  }
}
