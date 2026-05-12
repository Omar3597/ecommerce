import { Job } from "bullmq";
import { IEmailStrategy } from "../email.strategy.interface";
import { EmailService } from "../../../shared/services/email/email.service";
import { UserChangeEmailPayload } from "../../../events/event.types";
import { TokenService, TokenRepo, ActionTokenType } from "../../../shared/tokens";

export class ChangeEmailStrategy implements IEmailStrategy {
  private tokenService = new TokenService(new TokenRepo());

  constructor(private emailService: EmailService) {}

  async execute(job: Job<UserChangeEmailPayload>): Promise<void> {
    console.log("Executing ChangeEmailStrategy ...");
    const { userId, email, name } = job.data;
    const verifyUrl = await this.tokenService.createActionLink(
      userId,
      ActionTokenType.EMAIL_CHANGE
    );
    await this.emailService.sendEmailChange({
      name,
      email,
      verifyUrl,
      expiresInMinutes: 10,
    });
  }
}
