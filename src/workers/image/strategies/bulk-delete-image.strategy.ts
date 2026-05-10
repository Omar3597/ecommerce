import { Job } from "bullmq";
import { IImageStrategy } from "../image.strategy.interface";
import { ProductDeletedPayload } from "../../../events/event.types";
import { CloudStorageService } from "../../../shared/services/cloudStorage/services/cloudStorage.service";

export class BulkDeleteImageStrategy implements IImageStrategy {
  constructor(private cloudStorageService: CloudStorageService) {}

  async execute(job: Job<ProductDeletedPayload>): Promise<void> {
    console.log("Executing BulkDeleteImageStrategy ...");
    await this.cloudStorageService.bulkDeleteImages(job.data);
  }
}
