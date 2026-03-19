import crypto from "crypto";
import { PrismaClient, TokenType } from "../../../generated/prisma/client";
import Email from "../utils/email";
import { getConfig } from "../../config/env";

const config = getConfig();

export { TokenType as EmailTokenType };

export type EmailRecipient = {
  id: string;
  firstName: string;
  email: string;
};

type TokenEmailConfig = {
  endpoint: string;
  routePrefix: string;
  expiresInMinutes: number;
  sendEmail: (emailService: Email) => Promise<void>;
};

type GeneratedToken = {
  rawToken: string;
  hashedToken: string;
};

const tokenEmailConfig: Record<TokenType, TokenEmailConfig> = {
  [TokenType.PASSWORD_RESET]: {
    endpoint: "reset-password",
    routePrefix: "/auth",
    expiresInMinutes: 10,
    sendEmail: (email) => email.sendPasswordReset(),
  },
  [TokenType.VERIFICATION]: {
    endpoint: "verify-email",
    routePrefix: "/auth",
    expiresInMinutes: 10,
    sendEmail: (email) => email.sendVerificationEmail(),
  },
  [TokenType.REACTIVATION]: {
    endpoint: "reactivate",
    routePrefix: "/auth",
    expiresInMinutes: 10,
    sendEmail: (email) => email.sendReactivationEmail(),
  },
  [TokenType.EMAIL_CHANGE]: {
    endpoint: "",
    routePrefix: "/users/me/email-change/verify",
    expiresInMinutes: 10,
    sendEmail: (email) => email.sendEmailChangeVerificationEmail(),
  },
};

export class AuthEmailTokenService {
  constructor(private readonly prisma: PrismaClient) {}

  private generateToken(): GeneratedToken {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    return { rawToken, hashedToken };
  }

  private getExpiresAt(expiresInMinutes: number) {
    return new Date(Date.now() + expiresInMinutes * 60 * 1000);
  }

  private async upsertToken(
    userId: string,
    type: TokenType,
    hashedToken: string,
    expiresAt: Date,
  ) {
    await this.prisma.shortToken.upsert({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      create: {
        userId,
        token: hashedToken,
        type,
        expiresAt,
      },
      update: {
        token: hashedToken,
        expiresAt,
      },
    });
  }

  private buildUrl(routePrefix: string, endpoint: string, rawToken: string) {
    const cleanPrefix = routePrefix.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, "");
    const path = cleanEndpoint
      ? `${cleanPrefix}/${cleanEndpoint}`
      : cleanPrefix;

    return `${config.BASE_URL}${path}/${rawToken}`;
  }

  private async sendEmail(
    user: EmailRecipient,
    type: TokenType,
    sendEmail: TokenEmailConfig["sendEmail"],
    url: string,
  ) {
    try {
      await sendEmail(new Email(user, url));
    } catch (err) {
      console.error(`Failed to send ${type} email:`, err);
    }
  }

  async send(user: EmailRecipient, type: TokenType) {
    const tokenConfig = tokenEmailConfig[type];
    const { rawToken, hashedToken } = this.generateToken();
    const expiresAt = this.getExpiresAt(tokenConfig.expiresInMinutes);

    await this.upsertToken(user.id, type, hashedToken, expiresAt);

    const url = this.buildUrl(
      tokenConfig.routePrefix,
      tokenConfig.endpoint,
      rawToken,
    );

    await this.sendEmail(user, type, tokenConfig.sendEmail, url);
  }
}
