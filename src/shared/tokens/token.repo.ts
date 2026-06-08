import { cacheAdapter } from "../../infra/cache";
import { ActionTokenType } from "./types/action-token-type.enum";
import type { IActionTokenPayload } from "./types/action-token-payload.interface";

// TTL in seconds — 10 minutes
const ACTION_TOKEN_TTL_SECONDS = 10 * 60;

export class TokenRepo {
  setActionToken(
    hashedToken: string,
    type: ActionTokenType,
    payload: IActionTokenPayload,
  ): Promise<void> {
    const key = this.buildKey(hashedToken, type);
    return cacheAdapter.set<IActionTokenPayload>(
      key,
      payload,
      ACTION_TOKEN_TTL_SECONDS,
    );
  }

  getActionToken(
    hashedToken: string,
    type: ActionTokenType,
  ): Promise<IActionTokenPayload | null> {
    const key = this.buildKey(hashedToken, type);
    return cacheAdapter.get<IActionTokenPayload>(key);
  }

  deleteActionToken(hashedToken: string, type: ActionTokenType): Promise<void> {
    const key = this.buildKey(hashedToken, type);
    return cacheAdapter.del(key);
  }

  private buildKey(hashedToken: string, type: ActionTokenType): string {
    return `action_token:${type}:${hashedToken}`;
  }
}
