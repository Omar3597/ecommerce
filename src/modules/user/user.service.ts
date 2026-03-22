import bcrypt from "bcrypt";
import AppError from "../../common/utils/appError";
import {
  requestEmailChangeInput,
  updateProfileInput,
  updatePasswordInput,
  verifyEmailChangeInput,
} from "./user.validator";
import { User } from "@prisma/client";
import crypto from "crypto";
import {
  AuthEmailTokenService,
  EmailTokenType,
} from "../../common/services/email-token.service";
import { UserRepo } from "./user.repo";

export class UserService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly authEmailTokenService: AuthEmailTokenService,
  ) {}

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

    void this.authEmailTokenService
      .send(
        {
          id: updatedUser.id,
          email: data.email,
          firstName: updatedUser.name.split(" ")[0] ?? updatedUser.name,
        },
        EmailTokenType.EMAIL_CHANGE,
      )
      .catch((err) =>
        console.error("Failed to create email change token: ", err),
      );
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
  }
}
