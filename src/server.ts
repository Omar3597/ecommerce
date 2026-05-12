import { getConfig } from "./config/env";
import app from "./app";
import logger from "./config/logger";
import { EventBus } from "./infra/event-bus";
import { QueueClient, QueueRegistry, QueueFactory } from "./infra/queue";
import { bootstrapSubscribers } from "./events";

const queueClient = QueueClient.getInstance();
const queueRegistry = QueueRegistry.getInstance();
const queueFactory = new QueueFactory(queueClient, queueRegistry);
const eventBus = EventBus.getInstance();

bootstrapSubscribers(eventBus, queueFactory);

process.on("uncaughtException", (err: Error) => {
  logger.error({ error: err }, "UNCAUGHT EXCEPTION! Shutting down...");
  process.exit(1);
});

const config = getConfig();

const server = app.listen(config.APP_PORT, "0.0.0.0", () => {
  logger.info(`Server running on port ${config.APP_PORT}`);
});

process.on("unhandledRejection", (err: unknown) => {
  logger.error("UNHANDLED REJECTION! Shutting down...");

  if (err instanceof Error) {
    logger.error({ error: err });
  }

  server.close(() => {
    process.exit(1);
  });
});
