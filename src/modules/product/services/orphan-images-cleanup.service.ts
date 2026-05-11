import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../../../lib/prisma";
import { StorageService } from "../../../shared/services/cloudStorage/services/cloudStorage.service";
import logger from "../../../config/logger";

export class OrphanImagesCleanupService {
  private logger = logger.child({ module: "product" });

  async cleanupOrphanImages(): Promise<void> {
    try {
      // ── 1. Gather all known publicIds from the database ──────────────────
      const dbImages = await prisma.productImage.findMany({
        select: { publicId: true },
      });
      const knownPublicIds = new Set(dbImages.map((img) => img.publicId));

      // ── 2. List all assets in Cloudinary folder ───────────────────────────
      const orphanPublicIds: string[] = [];
      let nextCursor: string | undefined;

      do {
        const searchResult = await cloudinary.search
          .expression("folder:ecommerce/products")
          .with_field("public_id")
          .max_results(500)
          .next_cursor(nextCursor as string)
          .execute();

        for (const resource of searchResult.resources as {
          public_id: string;
        }[]) {
          if (!knownPublicIds.has(resource.public_id)) {
            orphanPublicIds.push(resource.public_id);
          }
        }

        nextCursor = searchResult.next_cursor as string | undefined;
      } while (nextCursor);

      // ── 3. Delete orphan assets ───────────────────────────────────────────
      if (orphanPublicIds.length === 0) {
        this.logger.info("Orphan image cleanup: no orphan images found.");
        return;
      }

      await StorageService.bulkDeleteImages({ publicIds: orphanPublicIds });

      this.logger.info(
        `Orphan image cleanup: deleted ${orphanPublicIds.length} orphan image(s) from Cloudinary.`,
      );
    } catch (err) {
      this.logger.error({ err }, "Orphan image cleanup job failed");
      throw err;
    }
  }
}
