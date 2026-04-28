import redisClient from "../../config/redis";
import logger from "../../config/logger";

class CacheService {
  async wrap<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>,
  ): Promise<T> {
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      logger.error({ err, key }, "Cache Read Error");
    }

    const result = await fetchFn();

    try {
      await redisClient.set(key, JSON.stringify(result), "EX", ttl);
    } catch (err) {
      logger.error({ err, key }, "Cache Write Error");
    }

    return result;
  }
}

const cacheService = new CacheService();

export default cacheService;
