import Redis from "ioredis";
import RedisMock from "ioredis-mock";
import { getConfig } from "./env";
import logger from "./logger";

class RedisService {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisService.instance) {
      const config = getConfig();

      if (config.env === "test") {
        RedisService.instance = new RedisMock() as unknown as Redis;
      } else {
        RedisService.instance = new Redis({
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          password: config.REDIS_PASSWORD,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
      }

      RedisService.instance.on("error", (error) => {
        logger.error({ error }, "Redis connection error");
      });

      RedisService.instance.on("connect", () => {
        logger.info("Successfully connected to Redis");
      });
    }

    return RedisService.instance;
  }
}

const redisClient = RedisService.getInstance();

export default redisClient;
