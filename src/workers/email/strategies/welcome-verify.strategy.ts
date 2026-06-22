import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { UserSignupPayload } from "../../../events/event.types";
import { TokenService, ActionTokenType } from "../../../shared/tokens";

export class WelcomeVerifyEmailStrategy implements IEmailStrategy {
  private tokenService = new TokenService();

  constructor(private emailService: EmailService) {}

  async execute(job: Job<UserSignupPayload>): Promise<void> {
    console.log("Executing WelcomeVerifyEmailStrategy ...");
    const { userId, email, name, expiresInMinutes } = job.data;
    const verifyUrl = await this.tokenService.createActionLink(
      { userId, name, email },
      ActionTokenType.VERIFICATION,
    );

    try {
      await this.emailService.sendWelcomeVerify({
        name,
        email,
        verifyUrl,
        expiresInMinutes,
      });
    } catch (error) {
      console.error(
        "Error occurred while sending welcome verify email:",
        error,
      );
    }
  }
}
