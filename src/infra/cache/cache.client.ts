import Redis from "ioredis";
import RedisMock from "ioredis-mock";
import { getConfig } from "../../config/env";
import logger from "../../config/logger";

type RedisConnectionName = "cache" | "queue";

function createRedisConnection(name: RedisConnectionName): Redis {
  const config = getConfig();

  if (config.env === "test") {
    return new RedisMock() as unknown as Redis;
  }

  const client = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    // Identifies the connection in Redis CLIENT LIST
    connectionName: name,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  client.on("connect", () => {
    logger.info(`Redis [${name}] connected`);
  });

  client.on("error", (error) => {
    logger.error({ error }, `Redis [${name}] connection error`);
  });

  return client;
}

// Cache connection — for all get/set/del/scan operations
export const cacheRedis = createRedisConnection("cache");

// Queue connection — reserved for BullMQ workers and queues
export const queueRedis = createRedisConnection("queue");
