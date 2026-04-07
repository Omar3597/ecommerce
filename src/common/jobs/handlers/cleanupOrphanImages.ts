import cron from "node-cron";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../../../lib/prisma";
import { StorageService } from "../../services/cloudinary.service";

export const cleanupOrphanImages = () => {
  // Cron expression: "0 0 * * *" → every day at 00:00
  cron.schedule("0 0 * * *", async () => {
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
        console.log("Orphan image cleanup: no orphan images found.");
        return;
      }

      await StorageService.bulkDeleteImages(orphanPublicIds);

      console.log(
        `Orphan image cleanup: deleted ${orphanPublicIds.length} orphan image(s) from Cloudinary.`,
      );
    } catch (err) {
      console.error("Orphan image cleanup job failed: ", err);
    }
  });
};
