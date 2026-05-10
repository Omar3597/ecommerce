import { Job } from "bullmq";
import { IImageStrategy } from "../image.strategy.interface";
import { CloudStorageService } from "../../../shared/services/cloudStorage/services/cloudStorage.service";
import { ProductImageRemovedPayload } from "../../../events";

export class DeleteImageStrategy implements IImageStrategy {
  constructor(private cloudStorageService: CloudStorageService) {}

  async execute(job: Job<ProductImageRemovedPayload>): Promise<void> {
    console.log("Executing DeleteImageStrategy ...");
    await this.cloudStorageService.deleteImage(job.data);
  }
}
