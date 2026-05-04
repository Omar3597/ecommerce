import { cacheRedis } from "./cache.client";
import logger from "../../config/logger";
import type { ICacheService } from "./cache.interface";

class CacheAdapter implements ICacheService {
  async wrap<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>,
  ): Promise<T> {
    try {
      const cached = await cacheRedis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      logger.error({ err, key }, "Cache wrap: read error");
    }

    const result = await fetchFn();

    if (result !== null && result !== undefined) {
      try {
        await cacheRedis.set(key, JSON.stringify(result), "EX", ttl);
      } catch (err) {
        logger.error({ err, key }, "Cache wrap: write error");
      }
    }

    return result;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await cacheRedis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (err) {
      logger.error({ err, key }, "Cache get: error");
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await cacheRedis.set(key, JSON.stringify(value), "EX", ttl);
    } catch (err) {
      logger.error({ err, key }, "Cache set: error");
    }
  }

  async del(key: string): Promise<void> {
    try {
      await cacheRedis.del(key);
    } catch (err) {
      logger.error({ err, key }, "Cache del: error");
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      let cursor = "0";

      do {
        const [nextCursor, keys] = await cacheRedis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );

        if (keys.length > 0) {
          await cacheRedis.del(...keys);
        }

        cursor = nextCursor;
      } while (cursor !== "0");
    } catch (err) {
      logger.error({ err, pattern }, "Cache invalidatePattern: error");
    }
  }
}

const cacheAdapter: ICacheService = new CacheAdapter();

export default cacheAdapter;
