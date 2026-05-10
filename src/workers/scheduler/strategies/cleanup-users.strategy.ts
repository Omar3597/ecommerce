import { ISchedulerStrategy } from "../scheduler.strategy.interface";
import { UserCleanupService } from "../../../modules/user";

export class CleanupUsersStrategy implements ISchedulerStrategy {

  constructor(private readonly userCleanupService: UserCleanupService) {}

  async execute(): Promise<void> {
    console.log("Executing cleanup users strategy...");
    await this.userCleanupService.cleanupUnverifiedUsers();
  }
}
