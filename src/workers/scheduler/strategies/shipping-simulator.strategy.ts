import { ISchedulerStrategy } from "../scheduler.strategy.interface";
import { ShippingSimulatorService } from "../../../modules/order";

export class ShippingSimulatorStrategy implements ISchedulerStrategy {
  constructor(
    private readonly shippingSimulatorService: ShippingSimulatorService,
  ) {}

  async execute(): Promise<void> {
    console.log("Executing shipping simulator strategy...");
    await this.shippingSimulatorService.simulate();
  }
}
