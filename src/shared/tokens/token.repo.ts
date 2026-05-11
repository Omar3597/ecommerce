import { prisma } from '../../lib/prisma';
import { ActionTokenType } from './types/action-token-type.enum';

export class TokenRepo {
  createActionToken(
    userId: string,
    hashedToken: string,
    type: ActionTokenType,
    expiresAt: Date,
  ) {
    return prisma.shortToken.create({
      data: { userId, token: hashedToken, type, expiresAt },
    });
  }
}
