import { Job, Worker } from "bullmq";
import { IWorker } from "../../infra/queue";
import { WorkerFactory } from "../../infra/queue";
import { QUEUE_NAMES, JOB_NAMES } from "../../infra/queue";
import { IOrderStrategy } from "./order.strategy.interface";
import { OrderExpirationService } from "../../modules/order";
import { ExpireOrderStrategy } from "./strategies";

export class OrderWorker implements IWorker {
  private worker?: Worker;
  private strategies: Map<string, IOrderStrategy> = new Map();

  constructor(
    private workerFactory: WorkerFactory,
    private expirationService: OrderExpirationService,
  ) {
    this.strategies.set(
      JOB_NAMES.ORDER.EXPIRE,
      new ExpireOrderStrategy(this.expirationService),
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
      QUEUE_NAMES.ORDER,
      this.process.bind(this),
    );
  }

  public async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
