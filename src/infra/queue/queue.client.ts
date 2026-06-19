import Redis, { type RedisOptions } from "ioredis";
import { IQueueClient } from "./queue.interface";
import { getConfig } from "../../config/env";
import logger from "../../config/logger";

const config = getConfig();

export class QueueClient implements IQueueClient {
  private static instance: QueueClient;
  private connection: Redis;

  private constructor() {
    const config = getConfig();
    const redisOptions: RedisOptions = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    if (
      process.env.REDIS_URL &&
      process.env.REDIS_URL.startsWith("rediss://")
    ) {
      redisOptions.tls = {
        rejectUnauthorized: false,
      };
    }

    this.connection = new Redis(config.REDIS_URL, redisOptions);

    this.connection.on("error", (err) => {
      logger.error({ err }, "Queue Redis connection error");
    });
  }

  public static getInstance(): QueueClient {
    if (!QueueClient.instance) {
      QueueClient.instance = new QueueClient();
    }
    return QueueClient.instance;
  }

  public getConnection(): Redis {
    return this.connection;
  }
}
