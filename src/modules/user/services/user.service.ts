import bcrypt from "bcrypt";
import AppError from "../../../shared/errors/appError";
import {
  requestEmailChangeInput,
  updateProfileInput,
  updatePasswordInput,
  verifyEmailChangeInput,
} from "../validators/user.validator";
import { User } from "@prisma/client";
import crypto from "crypto";
import { UserRepo } from "../repositories/user.repo";
import baseLogger from "../../../config/logger";
import { EventBus } from "../../../infra/event-bus";
import { EVENT_NAMES } from "../../../events";

export class UserService {
  private logger = baseLogger.child({ module: "user" });
  constructor(private readonly userRepo: UserRepo) {}

  async updateProfile(user: User, data: updateProfileInput) {
    if (data.name === user.name) {
      throw new AppError(400, "Name is already up to date");
    }

    return this.userRepo.updateProfile(user.id, data.name);
  }

  async updatePassword(user: User, data: updatePasswordInput) {
    const { currentPassword, newPassword } = data;

    const validCurrentPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!validCurrentPassword) {
      throw new AppError(401, "Invalid current password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.userRepo.updatePasswordAndRevokeAllTokens(
      user.id,
      hashedPassword,
    );

    this.logger.warn(
      {
        action: "UPDATE_PASSWORD",
        userId: user.id,
        entityId: user.id,
      },
      "Password updated",
    );
  }

  async requestEmailChange(user: User, data: requestEmailChangeInput) {
    if (data.email === user.email) {
      throw new AppError(400, "New email must be different from current email");
    }

    if (await this.userRepo.isEmailTaken(data.email)) {
      throw new AppError(400, "Email already in use");
    }

    const updatedUser = await this.userRepo.setPendingEmail(
      user.id,
      data.email,
    );

    EventBus.getInstance().emit(EVENT_NAMES.USER.CHANGE_EMAIL_REQUEST, {
      userId: updatedUser.id,
      email: data.email,
      name: updatedUser.name,
    });

    this.logger.info({
      userId: user.id,
      action: "REQUEST_EMAIL_CHANGE",
      message: "Email change requested",
    });
  }

  async verifyEmailChange(user: User, data: verifyEmailChangeInput) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(data.token)
      .digest("hex");

    const storedToken = await this.userRepo.findValidEmailChangeTokenForUser(
      hashedToken,
      user.id,
    );

    if (!storedToken) {
      throw new AppError(400, "Token is invalid or has expired");
    }

    const { pendingEmail } = storedToken.user;
    if (!pendingEmail) {
      throw new AppError(400, "No pending email change request found");
    }

    if (await this.userRepo.isEmailTaken(pendingEmail)) {
      throw new AppError(400, "Email already in use");
    }

    await this.userRepo.updateEmailAndDeleteShortToken(
      user.id,
      pendingEmail,
      storedToken.id,
    );

    this.logger.warn(
      {
        action: "VERIFY_EMAIL_CHANGE",
        userId: user.id,
        entityId: user.id,
      },
      "Email change verified",
    );
  }
}
