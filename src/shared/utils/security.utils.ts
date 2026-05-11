import crypto from 'crypto';

export class SecurityUtils {
  generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  hashTokenSHA256(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  hashTokenHMAC(token: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(token).digest('hex');
  }
}
