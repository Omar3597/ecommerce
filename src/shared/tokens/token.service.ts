import { getConfig } from "../../config/env";
import { SecurityUtils } from "../utils/security.utils";
import { TokenRepo } from "./token.repo";
import { ActionTokenType } from "./types/action-token-type.enum";
import AppError from "../errors/appError";

const ACTION_TOKEN_ROUTES: Record<ActionTokenType, string> = {
  [ActionTokenType.VERIFICATION]: "/auth/verify-email",
  [ActionTokenType.PASSWORD_RESET]: "/auth/reset-password",
  [ActionTokenType.EMAIL_CHANGE]: "/users/email-change/verify",
};

export class TokenService {
  private readonly securityUtils = new SecurityUtils();

  constructor(private readonly tokenRepo: TokenRepo) {}

  async createActionLink(
    userId: string,
    type: ActionTokenType,
  ): Promise<string> {
    const rawToken = this.securityUtils.generateRandomToken(32);
    const hashedToken = this.securityUtils.hashTokenSHA256(rawToken);

    const route = ACTION_TOKEN_ROUTES[type];
    if (!route) throw new AppError(500, `Unknown action token type: ${type}`);

    const config = getConfig();
    const url = `${config.BASE_URL}${route}/${rawToken}`;

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.tokenRepo.createActionToken(
      userId,
      hashedToken,
      type,
      expiresAt,
    );

    return url;
  }
}
