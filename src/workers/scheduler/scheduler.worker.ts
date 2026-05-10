import { Job, Worker } from "bullmq";
import { IWorker } from "../../infra/queue";
import { WorkerFactory } from "../../infra/queue";
import { QUEUE_NAMES, JOB_NAMES } from "../../infra/queue";
import { ISchedulerStrategy } from "./scheduler.strategy.interface";
import {
  CleanupCartsStrategy,
  CleanupOrphanImagesStrategy,
  CleanupTokensStrategy,
  CleanupUsersStrategy,
  ShippingSimulatorStrategy,
} from "./strategies";
import { CartCleanupService } from "../../modules/cart";
import { ShippingSimulatorService } from "../../modules/order";
import { TokensCleanupService } from "../../modules/auth";
import { OrphanImagesCleanupService } from "../../modules/product";
import { UserCleanupService } from "../../modules/user";

export class SchedulerWorker implements IWorker {
  private worker?: Worker;
  private strategies: Map<string, ISchedulerStrategy> = new Map();

  constructor(
    private workerFactory: WorkerFactory,
    services: {
      cartCleanupService: CartCleanupService;
      shippingSimulatorService: ShippingSimulatorService;
      orphanImagesCleanupService: OrphanImagesCleanupService;
      tokensCleanupService: TokensCleanupService;
      userCleanupService: UserCleanupService;
    },
  ) {
    this.strategies.set(
      JOB_NAMES.SCHEDULER.CLEANUP_CARTS,
      new CleanupCartsStrategy(services.cartCleanupService),
    );
    this.strategies.set(
      JOB_NAMES.SCHEDULER.SIMULATE_SHIPPING,
      new ShippingSimulatorStrategy(services.shippingSimulatorService),
    );
    this.strategies.set(
      JOB_NAMES.SCHEDULER.CLEANUP_ORPHAN_IMAGES,
      new CleanupOrphanImagesStrategy(services.orphanImagesCleanupService),
    );
    this.strategies.set(
      JOB_NAMES.SCHEDULER.CLEANUP_TOKENS,
      new CleanupTokensStrategy(services.tokensCleanupService),
    );
    this.strategies.set(
      JOB_NAMES.SCHEDULER.CLEANUP_USERS,
      new CleanupUsersStrategy(services.userCleanupService),
    );
  }

  private async process(job: Job): Promise<void> {
    const strategy = this.strategies.get(job.name);
    if (!strategy) {
      throw new Error(`No strategy registered for job: ${job.name}`);
    }
    await strategy.execute(job);
  }

  public start(): void {
    this.worker = this.workerFactory.create(
      QUEUE_NAMES.SCHEDULER,
      this.process.bind(this),
    );
  }

  public async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
