import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { UserRequestVerifyPayload } from "../../../events/event.types";
import { TokenService, ActionTokenType } from "../../../shared/tokens";

export class VerifyEmailStrategy implements IEmailStrategy {
  private tokenService = new TokenService();

  constructor(private emailService: EmailService) {}

  async execute(job: Job<UserRequestVerifyPayload>): Promise<void> {
    console.log("Executing VerifyEmailStrategy ...");
    const { userId, email, name, expiresInMinutes } = job.data;
    const verifyUrl = await this.tokenService.createActionLink(
      { userId, name, email },
      ActionTokenType.VERIFICATION,
    );
    await this.emailService.sendVerification({
      name,
      email,
      verifyUrl,
      expiresInMinutes,
    });
  }
}
