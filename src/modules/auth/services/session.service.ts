import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AppError from "../../../shared/errors/appError";
import { LoginInput } from "../validators/auth.validator";
import { AuthRepo } from "../repositories/auth.repo";
import { SecurityUtils } from "../../../shared/utils/security.utils";
import { getConfig } from "../../../config/env";
import baseLogger from "../../../config/logger";
import { EventBus } from "../../../infra/event-bus";
import { EVENT_NAMES } from "../../../events";

const config = getConfig();

export class SessionService {
  private logger = baseLogger.child({ module: "session" });
  private securityUtils = new SecurityUtils();

  constructor(private readonly authRepo: AuthRepo) {}

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

      await bcrypt.compare(data.password, "$2b$12$invalidhash"); // constant-time guard
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
      EventBus.getInstance().emit(EVENT_NAMES.USER.REQUEST_VERIFY, {
        userId: user.id,
        email: user.email,
        name: user.name,
      });

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

    const storedToken = await this.authRepo.findValidRefreshToken(hashedOldToken);

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

  async logout(refreshToken: string) {
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);
    await this.authRepo.deleteRefreshTokenByToken(hashedRefreshToken);
  }

  async logoutFromAllDevices(userId: string) {
    await this.authRepo.deleteRefreshTokenByUserId(userId);
  }

  private generateAccessToken(userId: string, role: string) {
    return jwt.sign({ id: userId, role }, config.JWT_SECRET, {
      expiresIn: "15m",
    });
  }

  private generateRefreshToken() {
    return this.securityUtils.generateRandomToken();
  }

  private hashRefreshToken(refreshToken: string) {
    return this.securityUtils.hashTokenHMAC(refreshToken, config.REFRESH_TOKEN_SECRET);
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
}
