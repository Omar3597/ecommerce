import { QueueFactory, QUEUE_NAMES, JOB_NAMES } from "../../infra/queue";

export class Scheduler {
  constructor(private queueFactory: QueueFactory) {}

  public async register(): Promise<void> {
    const queue = this.queueFactory.getOrCreate(QUEUE_NAMES.SCHEDULER);

    await queue.upsertJobScheduler(
      JOB_NAMES.SCHEDULER.CLEANUP_CARTS,
      { pattern: "0 0 */4 * *" }, // Every 4 days
      { name: JOB_NAMES.SCHEDULER.CLEANUP_CARTS },
    );

    await queue.upsertJobScheduler(
      JOB_NAMES.SCHEDULER.SIMULATE_SHIPPING,
      { pattern: "0 */8 * * *" }, // Every 8 hours
      { name: JOB_NAMES.SCHEDULER.SIMULATE_SHIPPING },
    );

    await queue.upsertJobScheduler(
      JOB_NAMES.SCHEDULER.CLEANUP_ORPHAN_IMAGES,
      { pattern: "0 0 * * *" }, // every day at 00:00
      { name: JOB_NAMES.SCHEDULER.CLEANUP_ORPHAN_IMAGES },
    );

    await queue.upsertJobScheduler(
      JOB_NAMES.SCHEDULER.CLEANUP_TOKENS,
      { pattern: "0 * * * *" }, // hourly
      { name: JOB_NAMES.SCHEDULER.CLEANUP_TOKENS },
    );

    await queue.upsertJobScheduler(
      JOB_NAMES.SCHEDULER.CLEANUP_USERS,
      { pattern: "0 */12 * * *" }, // every 12 hours
      { name: JOB_NAMES.SCHEDULER.CLEANUP_USERS },
    );
  }
}
