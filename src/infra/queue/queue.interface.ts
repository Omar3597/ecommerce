import { Job } from "bullmq";
import Redis from "ioredis";

export interface IJobStrategy<T = unknown> {
  execute(job: Job<T>): Promise<void>;
}

export interface IWorker {
  start(): void;
  close(): Promise<void>;
}

export interface IQueueClient {
  getConnection(): Redis;
}
