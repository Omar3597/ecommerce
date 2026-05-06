export interface IUploadResult {
  url: string;
  publicId: string;
}

export interface IUploadImageInput {
  fileBuffer: Buffer;
  folderPath: string;
  format?: string;
  transformations?: Record<string, unknown>[];
}

export interface IBulkUploadImagesInput {
  fileBuffers: Buffer[];
  folderPath: string;
  format?: string;
  transformations?: Record<string, unknown>[];
}

export interface IDeleteResult {
  deleted: Record<string, string>;
  partial: boolean;
}

export interface IDeleteImageInput {
  publicId: string;
}

export interface IBulkDeleteImagesInput {
  publicIds: string[];
}

export interface ICloudStorageProvider {
  uploadImage(data: IUploadImageInput): Promise<IUploadResult>;
  bulkUploadImages(data: IBulkUploadImagesInput): Promise<IUploadResult[]>;
  deleteImage(data: IDeleteImageInput): Promise<void>;
  bulkDeleteImages(
    data: IBulkDeleteImagesInput,
  ): Promise<IDeleteResult | undefined>;
}
