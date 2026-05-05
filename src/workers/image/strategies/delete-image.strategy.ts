import { Job } from "bullmq";
import { IImageStrategy } from "../image.strategy.interface";
import { CloudStorageService } from "../../../shared/services/cloudStorage/cloudStorage.service";
import { ProductImageRemovedPayload } from "../../../events";

export class DeleteImageStrategy implements IImageStrategy {
  constructor(private cloudinaryService: CloudStorageService) {}

  async execute(job: Job<ProductImageRemovedPayload>): Promise<void> {
    await this.cloudinaryService.deleteImage(job.data);
  }
}
