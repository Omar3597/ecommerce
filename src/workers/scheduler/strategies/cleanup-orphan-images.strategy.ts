import { ISchedulerStrategy } from "../scheduler.strategy.interface";
import { OrphanImagesCleanupService } from "../../../modules/product";

export class CleanupOrphanImagesStrategy implements ISchedulerStrategy {
  constructor(
    private readonly orphanImagesCleanupService: OrphanImagesCleanupService,
  ) {}

  async execute(): Promise<void> {
    console.log("Executing cleanup orphan images strategy...");
    await this.orphanImagesCleanupService.cleanupOrphanImages();
  }
}
