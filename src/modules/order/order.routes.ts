import { Router } from "express";
import { protect } from "../../common/middlewares/protect";
import { orderService } from "./order.service";
import { OrderController } from "./order.controller";
import paymentRouter from "../payment/payment.routes";

const router = Router();

const service = new orderService();
const controller = new OrderController(service);

router
  .route("/")
  .get(controller.getAllOrders)
  .post(controller.createOrderFromCart);

router.route("/:orderId").get(controller.getOrderById);

router.use("/:orderId/payment", paymentRouter);

export default router;
