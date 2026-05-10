import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { UserRequestVerifyPayload } from "../../../events/event.types";

export class VerifyEmailStrategy implements IEmailStrategy {
  constructor(private emailService: EmailService) {}

  async execute(job: Job<UserRequestVerifyPayload>): Promise<void> {
    console.log("Executing VerifyEmailStrategy ...");
    await this.emailService.sendVerification(job.data);
  }
}
