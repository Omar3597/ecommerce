import {
  ICloudStorageProvider,
  IUploadResult,
  IDeleteResult,
  CloudStorageProviderFactory,
  IBulkDeleteImagesInput,
  IBulkUploadImagesInput,
  IDeleteImageInput,
  IUploadImageInput,
} from "../../../infra/cloudStorage";

export class CloudStorageService {
  private readonly provider: ICloudStorageProvider;

  constructor(provider: ICloudStorageProvider) {
    this.provider = provider;
  }

  async uploadImage(data: IUploadImageInput): Promise<IUploadResult> {
    return this.provider.uploadImage(data);
  }

  async bulkUploadImages(
    data: IBulkUploadImagesInput,
  ): Promise<IUploadResult[]> {
    return this.provider.bulkUploadImages(data);
  }

  async deleteImage(data: IDeleteImageInput): Promise<void> {
    return this.provider.deleteImage(data);
  }

  async bulkDeleteImages(
    data: IBulkDeleteImagesInput,
  ): Promise<IDeleteResult | undefined> {
    return this.provider.bulkDeleteImages(data);
  }
}

export const StorageService = new CloudStorageService(
  CloudStorageProviderFactory.create(),
);
