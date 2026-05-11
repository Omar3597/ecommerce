import bcrypt from "bcrypt";
import AppError from "../../../shared/errors/appError";
import { forgotPasswordInput } from "../validators/auth.validator";
import { AuthRepo } from "../repositories/auth.repo";
import { SecurityUtils } from "../../../shared/utils/security.utils";
import baseLogger from "../../../config/logger";
import { EventBus } from "../../../infra/event-bus";
import { EVENT_NAMES } from "../../../events";

export class PasswordService {
  private logger = baseLogger.child({ module: "password" });
  private securityUtils = new SecurityUtils();

  constructor(private readonly authRepo: AuthRepo) {}

  async forgotPassword(data: forgotPasswordInput) {
    const user = await this.authRepo.findActiveUserForPasswordReset(data.email);

    if (!user) return;

    this.logger.info(
      {
        action: "PASSWORD_RESET_REQUEST",
        userId: user.id,
      },
      "Password reset requested",
    );

    EventBus.getInstance().emit(EVENT_NAMES.USER.FORGOT_PASSWORD, {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresInMinutes: 10,
    });
  }

  async resetPassword(token: string, password: string) {
    const hashedToken = this.securityUtils.hashTokenSHA256(token);
    const storedToken =
      await this.authRepo.findValidPasswordResetToken(hashedToken);

    if (!storedToken) {
      this.logger.warn(
        {
          action: "PASSWORD_RESET_FAILED",
          userId: null,
        },
        "Failed password reset attempt due to invalid or expired token",
      );
      throw new AppError(400, "Token is invalid or has expired");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await this.authRepo.resetPasswordAndRevokeTokens(
      storedToken.userId,
      hashedPassword,
    );
    this.logger.info(
      {
        action: "PASSWORD_RESET_SUCCESS",
        userId: storedToken.userId,
      },
      "Password reset successfully",
    );
    EventBus.getInstance().emit(EVENT_NAMES.USER.PASSWORD_CHANGED, {
      userId: storedToken.userId,
      email: storedToken.user.email,
      expiresInMinutes: 10,
    });
    return result;
  }
}
