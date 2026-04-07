import { Readable } from "node:stream";
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import { getConfig } from "../../config/env";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export interface CloudinaryDeleteResult {
  deleted: Record<string, string>;
  partial: boolean;
}

export class CloudinaryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CloudinaryError";
  }
}

// ── Configuration (lazy, once) ────────────────────────────────────────────────

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    getConfig();

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  configured = true;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const StorageService = {
  async uploadImage(
    fileBuffer: Buffer,
    folderName: string,
  ): Promise<CloudinaryUploadResult> {
    ensureConfigured();

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `ecommerce/${folderName}` },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            return reject(
              new CloudinaryError("Image upload failed", error),
            );
          }
          if (!result) {
            return reject(
              new CloudinaryError("Image upload returned no result"),
            );
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );

      // Use Node.js native Readable
      Readable.from(fileBuffer).pipe(uploadStream);
    });
  },

  async bulkUploadImages(
    fileBuffers: Buffer[],
    folderName: string,
  ): Promise<CloudinaryUploadResult[]> {
    try {
      return await Promise.all(
        fileBuffers.map((buffer) => this.uploadImage(buffer, folderName)),
      );
    } catch (error) {
      if (error instanceof CloudinaryError) throw error;
      throw new CloudinaryError("Bulk image upload failed", error);
    }
  },

  async deleteImage(publicId: string): Promise<void> {
    ensureConfigured();

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new CloudinaryError(`Failed to delete image: ${publicId}`, error);
    }
  },

  async bulkDeleteImages(
    publicIds: string[],
  ): Promise<CloudinaryDeleteResult | undefined> {
    if (!publicIds.length) return undefined;

    ensureConfigured();

    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return {
        deleted: result.deleted as Record<string, string>,
        partial: result.partial as boolean,
      };
    } catch (error) {
      throw new CloudinaryError("Bulk image deletion failed", error);
    }
  },
};
