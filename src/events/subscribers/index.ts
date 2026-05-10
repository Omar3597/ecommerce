import { IEventBus } from "../../infra/event-bus";
import { QueueFactory } from "../../infra/queue";
import { QUEUE_NAMES } from "../../infra/queue";
import { UserSubscriber } from "./user.subscriber";
import { PaymentSubscriber } from "./payment.subscriber";
import { ProductSubscriber } from "./product.subscriber";
import { OrderSubscriber } from "./order.subscriber";

export const bootstrapSubscribers = (
  eventBus: IEventBus,
  queueFactory: QueueFactory,
) => {
  const emailQueue = queueFactory.getOrCreate(QUEUE_NAMES.EMAIL);
  const imageQueue = queueFactory.getOrCreate(QUEUE_NAMES.IMAGE);
  const orderQueue = queueFactory.getOrCreate(QUEUE_NAMES.ORDER);

  const userSubscriber = new UserSubscriber(eventBus, emailQueue);
  const paymentSubscriber = new PaymentSubscriber(eventBus, emailQueue);
  const productSubscriber = new ProductSubscriber(eventBus, imageQueue);
  const orderSubscriber = new OrderSubscriber(eventBus, orderQueue, emailQueue);

  userSubscriber.register();
  paymentSubscriber.register();
  productSubscriber.register();
  orderSubscriber.register();
};
