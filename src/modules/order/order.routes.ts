import { Router } from "express";
import { OrderRepo } from "./order.repo";
import { orderService } from "./order.service";
import { OrderController } from "./order.controller";
import paymentRouter from "../payment/payment.routes";

const router = Router();

const orderRepo = new OrderRepo();
const service = new orderService(orderRepo);
const controller = new OrderController(service);

router
  .route("/")
  .get(controller.getAllOrders)
  .post(controller.createOrderFromCart);

router.route("/:orderId").get(controller.getOrderById);

router.use("/:orderId/payment", paymentRouter);

export default router;
