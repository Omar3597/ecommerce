import { Router } from "express";
import { OrderRepo } from "./order.repo";
import { orderService } from "./order.service";
import { OrderController } from "./order.controller";
import paymentRouter from "../payment/payment.routes";

const orderRouter = Router();

const orderRepo = new OrderRepo();
const service = new orderService(orderRepo);
const controller = new OrderController(service);

orderRouter
  .route("/")
  .get(controller.getAllOrders)
  .post(controller.createOrderFromCart);

orderRouter.route("/:orderId").get(controller.getOrderById);

orderRouter.use("/:orderId/payment", paymentRouter);

export default orderRouter;
