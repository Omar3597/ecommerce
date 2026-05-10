import { ISchedulerStrategy } from "../scheduler.strategy.interface";
import { TokensCleanupService } from "../../../modules/auth";

export class CleanupTokensStrategy implements ISchedulerStrategy {
  constructor(private readonly tokensCleanupService: TokensCleanupService) {}

  async execute(): Promise<void> {
    console.log("Executing cleanup tokens strategy...");
    await this.tokensCleanupService.cleanupExpiredTokens();
  }
}
