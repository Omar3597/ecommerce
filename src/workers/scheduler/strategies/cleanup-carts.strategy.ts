import { ISchedulerStrategy } from "../scheduler.strategy.interface";
import { CartCleanupService } from "../../../modules/cart";

export class CleanupCartsStrategy implements ISchedulerStrategy {
  constructor(private readonly cartCleanupService: CartCleanupService) {}

  async execute(): Promise<void> {
    console.log("Executing cleanup carts strategy...");
    await this.cartCleanupService.cleanupStaleCarts();
  }
}
