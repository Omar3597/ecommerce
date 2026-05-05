import { Queue } from "bullmq";
import { QUEUE_NAMES } from "./queue.constants";
import { IQueueClient } from "./queue.interface";
import { QueueRegistry } from "./queue.registry";

export class QueueFactory {
  constructor(
    private client: IQueueClient,
    private registry: QueueRegistry,
  ) {}

  public getOrCreate(name: QUEUE_NAMES): Queue {
    const existingQueue = this.registry.get(name);
    if (existingQueue) {
      return existingQueue;
    }

    const newQueue = new Queue(name, {
      connection: this.client.getConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });

    this.registry.register(name, newQueue);
    return newQueue;
  }
}
