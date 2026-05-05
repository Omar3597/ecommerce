import { Job, Worker } from "bullmq";
import { IWorker } from "../../infra/queue";
import { WorkerFactory } from "../../infra/queue";
import { QUEUE_NAMES, JOB_NAMES } from "../../infra/queue";
import { IImageStrategy } from "./image.strategy.interface";
import { DeleteImageStrategy } from "./strategies/delete-image.strategy";
import { BulkDeleteImageStrategy } from "./strategies/bulk-delete-image.strategy";

export class ImageWorker implements IWorker {
  private worker?: Worker;
  private strategies: Map<string, IImageStrategy> = new Map();

  constructor(
    private workerFactory: WorkerFactory,
    private cloudinaryService: any,
  ) {
    this.strategies.set(
      JOB_NAMES.IMAGE.DELETE,
      new DeleteImageStrategy(this.cloudinaryService),
    );
    this.strategies.set(
      JOB_NAMES.IMAGE.BULK_DELETE,
      new BulkDeleteImageStrategy(this.cloudinaryService),
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
      QUEUE_NAMES.IMAGE,
      this.process.bind(this),
    );
  }

  public async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
