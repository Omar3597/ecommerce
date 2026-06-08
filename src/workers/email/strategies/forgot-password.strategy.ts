import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { UserForgotPasswordPayload } from "../../../events/event.types";
import { TokenService, ActionTokenType } from "../../../shared/tokens";

export class ForgotPasswordEmailStrategy implements IEmailStrategy {
  private tokenService = new TokenService();

  constructor(private emailService: EmailService) {}

  async execute(job: Job<UserForgotPasswordPayload>): Promise<void> {
    console.log("Executing ForgotPasswordStrategy ...");
    const { userId, email, name, expiresInMinutes } = job.data;
    const resetUrl = await this.tokenService.createActionLink(
      { userId, name, email },
      ActionTokenType.PASSWORD_RESET,
    );
    await this.emailService.sendForgotPassword({
      name,
      email,
      resetUrl,
      expiresInMinutes,
    });
  }
}
