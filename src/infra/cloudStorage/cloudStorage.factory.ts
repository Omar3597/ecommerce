import type { ICloudStorageProvider } from "./cloudStorageProvider.interface";
import { CloudinaryProvider } from "./cloudinary.provider";
import { getConfig } from "../../config/env";

export class CloudStorageProviderFactory {
  static create(): ICloudStorageProvider {
    const config = getConfig();

    if (config.CLOUDINARY_CLOUD_NAME) {
      return new CloudinaryProvider();
    }

    throw new Error("No cloud storage provider configured");
  }
}
