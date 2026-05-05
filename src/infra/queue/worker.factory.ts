import { Processor, Worker, WorkerOptions } from "bullmq";
import { QUEUE_NAMES } from "./queue.constants";
import { IQueueClient } from "./queue.interface";

export class WorkerFactory {
  constructor(private client: IQueueClient) {}

  public create<T = unknown>(
    queueName: QUEUE_NAMES,
    processor: Processor<T>,
    opts?: Omit<WorkerOptions, "connection">,
  ): Worker<T> {
    const workerOptions: WorkerOptions = {
      connection: this.client.getConnection(),
      concurrency: 5,
      ...opts,
    };

    return new Worker<T>(queueName, processor, workerOptions);
  }
}
