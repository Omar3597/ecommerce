import { getConfig } from "./config/env";
import app from "./app";
import { initCronJobs } from "./common/jobs/cron";

initCronJobs();

process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

const config = getConfig();

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`Server running on port ${config.port}`);
});

process.on("unhandledRejection", (err: unknown) => {
  console.error("UNHANDLED REJECTION! Shutting down...");

  if (err instanceof Error) {
    console.error(err.name, err.message);
  }

  server.close(() => {
    process.exit(1);
  });
});
