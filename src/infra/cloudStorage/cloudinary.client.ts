import { v2 as cloudinary } from "cloudinary";
import { getConfig } from "../../config/env";
import logger from "../../config/logger";

function createCloudinaryClient() {
  const config = getConfig();

  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });

  logger.info("Cloudinary client configured");

  return cloudinary;
}

export const cloudinaryClient = createCloudinaryClient();
