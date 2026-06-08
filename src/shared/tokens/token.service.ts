import { getConfig } from "../../config/env";
import { SecurityUtils } from "../utils/security.utils";
import { TokenRepo } from "./token.repo";
import { ActionTokenType } from "./types/action-token-type.enum";
import type { IActionTokenPayload } from "./types/action-token-payload.interface";
import AppError from "../errors/appError";

const ACTION_TOKEN_ROUTES: Record<ActionTokenType, string> = {
  [ActionTokenType.VERIFICATION]: "/auth/verify-email",
  [ActionTokenType.PASSWORD_RESET]: "/auth/reset-password",
  [ActionTokenType.EMAIL_CHANGE]: "/users/email-change/verify",
};

export class TokenService {
  private readonly securityUtils = new SecurityUtils();
  private readonly tokenRepo = new TokenRepo();

  async createActionLink(
    payload: IActionTokenPayload,
    type: ActionTokenType,
  ): Promise<string> {
    const rawToken = this.securityUtils.generateRandomToken(32);
    const hashedToken = this.securityUtils.hashTokenSHA256(rawToken);

    const route = ACTION_TOKEN_ROUTES[type];
    if (!route) throw new AppError(500, `Unknown action token type: ${type}`);

    await this.tokenRepo.setActionToken(hashedToken, type, payload);

    const config = getConfig();
    return `${config.BASE_URL}${route}/${rawToken}`;
  }

  async verifyAndConsumeToken(
    rawToken: string,
    type: ActionTokenType,
  ): Promise<IActionTokenPayload | null> {
    const hashedToken = this.securityUtils.hashTokenSHA256(rawToken);

    const payload = await this.tokenRepo.getActionToken(hashedToken, type);
    if (!payload) return null;

    await this.tokenRepo.deleteActionToken(hashedToken, type);

    return payload;
  }
}
