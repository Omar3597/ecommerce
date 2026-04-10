import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AppError from "../../common/utils/appError";
import { SignupInput, LoginInput, forgotPasswordInput } from "./auth.validator";
import crypto from "crypto";
import {
  AuthEmailTokenService,
  EmailTokenType,
} from "../../common/services/email-token.service";
import { AuthRepo } from "./auth.repo";
import { getConfig } from "../../config/env";
import baseLogger from "../../config/logger";

const config = getConfig();

export class AuthService {
  private logger = baseLogger.child({ module: "auth" });
  constructor(
    private readonly authRepo: AuthRepo,
    private readonly authEmailTokenService: AuthEmailTokenService,
  ) {}

  private sendAuthEmail(
    user: { id: string; name: string; email: string },
    emailTokenType: EmailTokenType,
  ) {
    void this.authEmailTokenService
      .send(
        {
          id: user.id,
          email: user.email,
          firstName: user.name.split(" ")[0] ?? user.name,
        },
        emailTokenType,
      )
      .catch((err) =>
        console.error(`Failed to send ${emailTokenType} email: `, err),
      );
  }

  private generateAccessToken(userId: string, role: string) {
    return jwt.sign({ id: userId, role }, config.JWT_SECRET, {
      expiresIn: "15m",
    });
  }

  private generateRefreshToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  private hashRefreshToken(refreshToken: string) {
    return crypto
      .createHmac("sha256", config.REFRESH_TOKEN_SECRET)
      .update(refreshToken)
      .digest("hex");
  }

  private getRefreshTokenExpiryDate(days = 5) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  private async enforceMaxSessions(userId: string) {
    const activeSessions = await this.authRepo.countSessionsByUserId(userId);

    if (activeSessions >= config.MAX_ACTIVE_SESSIONS) {
      await this.authRepo.deleteOldestSession(userId);
    }
  }

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

    this.sendAuthEmail(newUser, EmailTokenType.VERIFICATION);

    this.logger.info(
      {
        action: "CREATE_USER",
        entityId: newUser.id,
      },
      "User created",
    );

    return newUser;
  }

  async loginWithEmailAndPassword(data: LoginInput) {
    const user = await this.authRepo.findUserByEmail(data.email);

    if (!user || user.isDeleted || user.isBanned) {
      this.logger.warn(
        {
          action: "LOGIN_FAILED",
          userId: user?.id,
        },
        "Failed login attempt due to non-existent or inactive account",
      );

      await bcrypt.compare(data.password, "$2b$12$invalidhash");
      throw new AppError(401, "Invalid email or password");
    }

    const matchPasswords = await bcrypt.compare(data.password, user.password);
    if (!matchPasswords) {
      this.logger.warn(
        {
          action: "LOGIN_FAILED",
          userId: user.id,
        },
        "Failed login attempt due to incorrect password",
      );
      throw new AppError(401, "Invalid email or password");
    }

    if (!user.isVerified) {
      this.sendAuthEmail(user, EmailTokenType.VERIFICATION);

      throw new AppError(
        403,
        "Your account is not verified. A new verification link has been sent to your email.",
      );
    }

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);
    const expiresAt = this.getRefreshTokenExpiryDate();

    await this.enforceMaxSessions(user.id);
    await this.authRepo.createRefreshToken(
      user.id,
      hashedRefreshToken,
      expiresAt,
    );

    this.logger.info(
      {
        action: "LOGIN_SUCCESS",
        userId: user.id,
      },
      "User logged in successfully",
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async rotateRefreshToken(refreshToken: string) {
    const hashedOldToken = this.hashRefreshToken(refreshToken);

    const storedToken =
      await this.authRepo.findValidRefreshToken(hashedOldToken);

    if (!storedToken) {
      throw new AppError(401, "Invalid refresh token");
    }

    const { user } = storedToken;

    if (!user || user.isBanned || user.isDeleted) {
      await this.authRepo.deleteRefreshTokenByToken(hashedOldToken);
      throw new AppError(401, "User account is inactive or no longer exists");
    }

    const accessToken = this.generateAccessToken(user.id, user.role);
    const newRawRefreshToken = this.generateRefreshToken();
    const hashedNewToken = this.hashRefreshToken(newRawRefreshToken);
    const expiresAt = this.getRefreshTokenExpiryDate();

    await this.authRepo.rotateRefreshToken({
      hashedOldToken,
      hashedNewToken,
      expiresAt,
      userId: user.id,
    });

    return {
      user,
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

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

    this.sendAuthEmail(user, EmailTokenType.PASSWORD_RESET);
  }

  async resetPassword(token: string, password: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
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
    return result;
  }

  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const storedToken =
      await this.authRepo.findValidVerificationToken(hashedToken);

    if (!storedToken) {
      throw new AppError(400, "Verification token is invalid or has expired");
    }

    await this.authRepo.verifyUserEmail(storedToken.userId, storedToken.id);
    this.logger.info(
      {
        action: "EMAIL_VERIFICATION_SUCCESS",
        userId: storedToken.userId,
      },
      "Email verified successfully",
    );
  }

  async logout(refreshToken: string) {
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);
    await this.authRepo.deleteRefreshTokenByToken(hashedRefreshToken);
  }

  async logoutFromAllDevices(userId: string) {
    await this.authRepo.deleteRefreshTokenByUserId(userId);
  }
}
