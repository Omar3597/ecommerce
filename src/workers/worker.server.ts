import {
  QueueClient,
  QueueFactory,
  QueueRegistry,
  WorkerFactory,
  QUEUE_NAMES,
} from "../infra/queue";
import { EmailProviderFactory } from "../infra/email/email.factory";
import { EmailService } from "../shared/services/email/email.service";
import { bootstrapWorkers } from "./index";
import { Scheduler } from "./scheduler/scheduler";
import logger from "../config/logger";
import { CloudStorageService } from "../shared/services/cloudStorage/services/cloudStorage.service";
import { CloudStorageProviderFactory } from "../infra/cloudStorage/cloudStorage.factory";
import { IServices } from "./worker.interface";
import {
  OrderExpirationService,
  ShippingSimulatorService,
} from "../modules/order";
import { CartCleanupService } from "../modules/cart";
import { OrphanImagesCleanupService } from "../modules/product";
import { TokensCleanupService } from "../modules/auth";
import { UserCleanupService } from "../modules/user";

async function main() {
  // Initialize Queue Infra
  const queueClient = QueueClient.getInstance();
  const queueRegistry = QueueRegistry.getInstance();
  const queueFactory = new QueueFactory(queueClient, queueRegistry);
  const workerFactory = new WorkerFactory(queueClient);

  // Initialize Services
  const emailProvider = EmailProviderFactory.create();
  const emailService = new EmailService(emailProvider);

  const cloudProvider = CloudStorageProviderFactory.create();
  const cloudStorageService = new CloudStorageService(cloudProvider);

  const emailQueue = queueFactory.getOrCreate(QUEUE_NAMES.EMAIL);
  const expirationService = new OrderExpirationService(emailQueue);
  const cartCleanupService = new CartCleanupService();
  const shippingSimulatorService = new ShippingSimulatorService();
  const orphanImagesCleanupService = new OrphanImagesCleanupService();
  const tokensCleanupService = new TokensCleanupService();
  const userCleanupService = new UserCleanupService();

  const services: IServices = {
    emailService,
    cloudStorageService,
    expirationService,
    cartCleanupService,
    shippingSimulatorService,
    orphanImagesCleanupService,
    tokensCleanupService,
    userCleanupService,
  };

  const workers = bootstrapWorkers(workerFactory, services);

  const scheduler = new Scheduler(queueFactory);
  await scheduler.register();

  logger.info("Worker process started successfully");

  const gracefulShutdown = async () => {
    logger.info("Shutting down worker process...");

    // Close all workers
    for (const worker of workers) {
      await worker.close();
    }

    // Disconnect Redis
    queueClient.getConnection().disconnect();

    logger.info("Worker process terminated gracefully");
    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}

main().catch((err) => {
  logger.error({ err }, "Worker process failed to start");
  process.exit(1);
});
