import { Queue } from "bullmq";

export class QueueRegistry {
  private static instance: QueueRegistry;
  private store: Map<string, Queue> = new Map();

  private constructor() {}

  public static getInstance(): QueueRegistry {
    if (!QueueRegistry.instance) {
      QueueRegistry.instance = new QueueRegistry();
    }
    return QueueRegistry.instance;
  }

  public register(name: string, queue: Queue): void {
    if (!this.store.has(name)) {
      this.store.set(name, queue);
    }
  }

  public get(name: string): Queue | undefined {
    return this.store.get(name);
  }

  public getAll(): Queue[] {
    return Array.from(this.store.values());
  }
}
