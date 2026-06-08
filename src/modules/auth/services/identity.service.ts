import bcrypt from "bcrypt";
import AppError from "../../../shared/errors/appError";
import { SignupInput } from "../validators/auth.validator";
import { AuthRepo } from "../repositories/auth.repo";
import { TokenService, ActionTokenType } from "../../../shared/tokens";
import baseLogger from "../../../config/logger";
import { EventBus } from "../../../infra/event-bus";
import { EVENT_NAMES } from "../../../events";

export class IdentityService {
  private logger = baseLogger.child({ module: "identity" });
  private tokenService = new TokenService();

  constructor(private readonly authRepo: AuthRepo) {}

  async registerUser(data: SignupInput) {
    const existingUser = await this.authRepo.findUserByEmail(data.email);

    if (existingUser) {
      if (existingUser.isBanned) {
        throw new AppError(
          403,
          "This account has been banned by admin. You cannot use this email again.",
        );
      }
      if (existingUser.isDeleted) {
        throw new AppError(
          409,
          "This account was previously deleted by you. Would you like to reactivate it?",
        );
      }

      throw new AppError(400, "Email already in use");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const newUser = await this.authRepo.createUser(data, hashedPassword);

    EventBus.getInstance().emit(EVENT_NAMES.USER.SIGNUP, {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      expiresInMinutes: 10,
    });

    this.logger.info(
      {
        action: "CREATE_USER",
        entityId: newUser.id,
      },
      "User created",
    );

    return newUser;
  }

  async verifyEmail(token: string) {
    const payload = await this.tokenService.verifyAndConsumeToken(
      token,
      ActionTokenType.VERIFICATION,
    );

    if (!payload) {
      throw new AppError(400, "Verification token is invalid or has expired");
    }

    await this.authRepo.verifyUserEmail(payload.userId);

    this.logger.info(
      {
        action: "EMAIL_VERIFICATION_SUCCESS",
        userId: payload.userId,
      },
      "Email verified successfully",
    );
  }
}
