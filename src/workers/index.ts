import { WorkerFactory } from "../infra/queue";
import { EmailWorker } from "./email/email.worker";
import { ImageWorker } from "./image/image.worker";
import { OrderWorker } from "./order/order.worker";
import { SchedulerWorker } from "./scheduler/scheduler.worker";
import { IWorker } from "../infra/queue";
import { type IServices } from "./worker.interface";

export const bootstrapWorkers = (
  workerFactory: WorkerFactory,
  services: IServices,
): IWorker[] => {
  const emailWorker = new EmailWorker(workerFactory, services.emailService);
  const imageWorker = new ImageWorker(
    workerFactory,
    services.cloudStorageService,
  );
  const orderWorker = new OrderWorker(
    workerFactory,
    services.expirationService,
  );
  const schedulerWorker = new SchedulerWorker(workerFactory, {
    cartCleanupService: services.cartCleanupService,
    shippingSimulatorService: services.shippingSimulatorService,
    orphanImagesCleanupService: services.orphanImagesCleanupService,
    tokensCleanupService: services.tokensCleanupService,
    userCleanupService: services.userCleanupService,
  });

  const workers = [emailWorker, imageWorker, orderWorker, schedulerWorker];

  workers.forEach((worker) => worker.start());

  return workers;
};
