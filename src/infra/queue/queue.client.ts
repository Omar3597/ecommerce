import Redis from "ioredis";
import { IQueueClient } from "./queue.interface";
import { getConfig } from "../../config/env";
import logger from "../../config/logger";

export class QueueClient implements IQueueClient {
  private static instance: QueueClient;
  private connection: Redis;

  private constructor() {
    const config = getConfig();
    this.connection = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

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
