import { Job, Worker } from "bullmq";
import { IWorker } from "../../infra/queue";
import { WorkerFactory } from "../../infra/queue";
import { QUEUE_NAMES, JOB_NAMES } from "../../infra/queue";
import { IImageStrategy } from "./image.strategy.interface";
import { CloudStorageService } from "../../shared/services/cloudStorage/cloudStorage.service";
import { BulkDeleteImageStrategy, DeleteImageStrategy } from "./strategies";

export class ImageWorker implements IWorker {
  private worker?: Worker;
  private strategies: Map<string, IImageStrategy> = new Map();

  constructor(
    private workerFactory: WorkerFactory,
    private cloudStorageService: CloudStorageService,
  ) {
    this.strategies.set(
      JOB_NAMES.IMAGE.DELETE,
      new DeleteImageStrategy(this.cloudStorageService),
    );
    this.strategies.set(
      JOB_NAMES.IMAGE.BULK_DELETE,
      new BulkDeleteImageStrategy(this.cloudStorageService),
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
