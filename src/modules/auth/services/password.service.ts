import bcrypt from "bcrypt";
import AppError from "../../../shared/errors/appError";
import { forgotPasswordInput } from "../validators/auth.validator";
import { AuthRepo } from "../repositories/auth.repo";
import { TokenService, ActionTokenType } from "../../../shared/tokens";
import baseLogger from "../../../config/logger";
import { EventBus } from "../../../infra/event-bus";
import { EVENT_NAMES } from "../../../events";

export class PasswordService {
  private logger = baseLogger.child({ module: "password" });
  private tokenService = new TokenService();

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
    const payload = await this.tokenService.verifyAndConsumeToken(
      token,
      ActionTokenType.PASSWORD_RESET,
    );

    if (!payload) {
      this.logger.warn(
        { action: "PASSWORD_RESET_FAILED", userId: null },
        "Failed password reset attempt due to invalid or expired token",
      );
      throw new AppError(400, "Token is invalid or has expired");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this.authRepo.resetPasswordAndRevokeTokens(payload.userId, hashedPassword);

    this.logger.info(
      { action: "PASSWORD_RESET_SUCCESS", userId: payload.userId },
      "Password reset successfully",
    );

    EventBus.getInstance().emit(EVENT_NAMES.USER.PASSWORD_CHANGED, {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      expiresInMinutes: 10,
    });
  }
}
