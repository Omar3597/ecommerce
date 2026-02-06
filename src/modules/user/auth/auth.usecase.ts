import crypto from "crypto";
import { User, PrismaClient } from "../../../../generated/prisma/client";
import Email from "../../../common/utils/email";
import AppError from "../../../common/utils/appError";
import { getConfig } from "../../../config/config";

const config = getConfig();

export enum EmailTokenType {
  PASSWORD_RESET = "PASSWORD_RESET",
  VERIFICATION = "VERIFICATION",
  REACTIVATION = "REACTIVATION",
  EMAIL_CHANGE = "EMAIL_CHANGE",
}

type TokenEmailConfig = {
  endpoint: string;
  routePrefix: string;
  expiresInMinutes: number;
  sendEmail: (emailService: Email) => Promise<void>;
};

const tokenEmailConfig: Record<EmailTokenType, TokenEmailConfig> = {
  [EmailTokenType.PASSWORD_RESET]: {
    endpoint: "reset-password",
    routePrefix: "/users/auth",
    expiresInMinutes: 10,
    sendEmail: (email) => email.sendPasswordReset(),
  },
  [EmailTokenType.VERIFICATION]: {
    endpoint: "verify-email",
    routePrefix: "/users/auth",
    expiresInMinutes: 10,
    sendEmail: (email) => email.sendVerificationEmail(),
  },
  [EmailTokenType.REACTIVATION]: {
    endpoint: "reactivate",
    routePrefix: "/users/auth",
    expiresInMinutes: 10,
    sendEmail: (email) => email.sendReactivationEmail(),
  },
  [EmailTokenType.EMAIL_CHANGE]: {
    endpoint: "",
    routePrefix: "/users/me/email-change/verify",
    expiresInMinutes: 10,
    sendEmail: (email) => email.sendEmailChangeVerificationEmail(),
  },
};

export class AuthTokenEmailUseCase {
  constructor(private prisma: PrismaClient) {}

  private buildUrl(routePrefix: string, endpoint: string, rawToken: string) {
    const cleanPrefix = routePrefix.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, "");
    const path = cleanEndpoint ? `${cleanPrefix}/${cleanEndpoint}` : cleanPrefix;
    return `${config.baseURL}${path}/${rawToken}`;
  }

  async send(user: User, type: EmailTokenType) {
    const tokenConfig = tokenEmailConfig[type];
    if (!tokenConfig) {
      throw new AppError(500, "Invalid email token type");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(
      Date.now() + tokenConfig.expiresInMinutes * 60 * 1000,
    );

    await this.prisma.shortToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        type,
        expiresAt,
      },
    });

    const url = this.buildUrl(tokenConfig.routePrefix, tokenConfig.endpoint, token);
    const emailService = new Email(user, url);

    try {
      await tokenConfig.sendEmail(emailService);
    } catch (err) {
      await this.prisma.shortToken.deleteMany({
        where: { userId: user.id, type },
      });
      throw new AppError(500, "Failed to send email");
    }
  }
}
