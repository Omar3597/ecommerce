import { Readable } from "node:stream";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import { cloudinaryClient } from "./cloudinary.client";
import {
  ICloudStorageProvider,
  IUploadResult,
  IUploadImageInput,
  IBulkUploadImagesInput,
  IDeleteImageInput,
  IBulkDeleteImagesInput,
  IDeleteResult,
} from "./cloudStorageProvider.interface";
import { CloudStorageError } from "./cloudinary.errors";

export class CloudinaryProvider implements ICloudStorageProvider {
  async uploadImage(data: IUploadImageInput): Promise<IUploadResult> {
    return new Promise<IUploadResult>((resolve, reject) => {
      const uploadStream = cloudinaryClient.uploader.upload_stream(
        {
          folder: data.folderPath,
          format: data.format || "auto",
          transformation: data.transformations || [],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            return reject(new CloudStorageError("Image upload failed", error));
          }
          if (!result) {
            return reject(
              new CloudStorageError("Image upload returned no result"),
            );
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );

      Readable.from(data.fileBuffer).pipe(uploadStream);
    });
  }

  async bulkUploadImages(
    data: IBulkUploadImagesInput,
  ): Promise<IUploadResult[]> {
    try {
      return await Promise.all(
        data.fileBuffers.map((buffer) =>
          this.uploadImage({
            fileBuffer: buffer,
            folderPath: data.folderPath,
            format: data.format,
            transformations: data.transformations,
          }),
        ),
      );
    } catch (error) {
      if (error instanceof CloudStorageError) throw error;
      throw new CloudStorageError("Bulk image upload failed", error);
    }
  }

  async deleteImage(data: IDeleteImageInput): Promise<void> {
    try {
      await cloudinaryClient.uploader.destroy(data.publicId);
    } catch (error) {
      throw new CloudStorageError(
        `Failed to delete image: ${data.publicId}`,
        error,
      );
    }
  }

  async bulkDeleteImages(
    data: IBulkDeleteImagesInput,
  ): Promise<IDeleteResult | undefined> {
    if (!data.publicIds.length) return undefined;

    try {
      const result = await cloudinaryClient.api.delete_resources(
        data.publicIds,
      );
      return {
        deleted: result.deleted as Record<string, string>,
        partial: result.partial as boolean,
      };
    } catch (error) {
      throw new CloudStorageError("Bulk image deletion failed", error);
    }
  }
}
