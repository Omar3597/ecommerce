import { getConfig } from "./config/env";
import app from "./app";
import { initCronJobs } from "./common/jobs/cron";
import logger from "./config/logger";

initCronJobs();

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
