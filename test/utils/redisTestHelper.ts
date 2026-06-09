import { cacheRedis } from "../../src/infra/cache/cache.client";
import logger from "../../src/config/logger";

/**
 * Scans and deletes all Redis keys matching the given prefix.
 * Used to clean up test-specific cache keys without using flushall.
 */
export async function cleanTestCache(prefix: string): Promise<void> {
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await cacheRedis.scan(
        cursor,
        "MATCH",
        `${prefix}*`,
        "COUNT",
        100,
      );

      if (keys && keys.length > 0) {
        await cacheRedis.del(...keys);
      }

      cursor = nextCursor;
    } while (cursor !== "0");
  } catch (err) {
    logger.error({ err, prefix }, "cleanTestCache: failed to scan and delete keys");
  }
}
