import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { UserSignupPayload } from "../../../events/event.types";

export class WelcomeVerifyEmailStrategy implements IEmailStrategy {
  constructor(private emailService: EmailService) {}

  async execute(job: Job<UserSignupPayload>): Promise<void> {
    console.log("Executing WelcomeVerifyEmailStrategy ...");
    await this.emailService.sendWelcomeVerify(job.data);
  }
}
