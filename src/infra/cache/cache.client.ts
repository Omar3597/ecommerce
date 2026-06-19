import Redis, { type RedisOptions } from "ioredis";
import { getConfig } from "../../config/env";
import logger from "../../config/logger";

type RedisConnectionName = "cache" | "queue";

function createRedisConnection(name: RedisConnectionName): Redis {
  const config = getConfig();

  if (config.env === "test") {
    // Dynamic import so `ioredis-mock` (a devDependency) is never loaded in
    // production where it doesn't exist after `npm prune --omit=dev`.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RedisMock = require("ioredis-mock");
    return new RedisMock() as unknown as Redis;
  }

  const redisOptions: RedisOptions = {
    connectionName: name,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };

  if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith("rediss://")) {
    redisOptions.tls = {
      rejectUnauthorized: false,
    };
  }

  const client = new Redis(config.REDIS_URL, redisOptions);

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
