import { Router } from "express";
import { OrderRepo } from "../repositories/order.repo";
import { OrderService } from "../services/order.service";
import { OrderController } from "../controllers/order.controller";
import { paymentRouter } from "../../payment";
const orderRouter = Router();

const orderRepo = new OrderRepo();
const service = new OrderService(orderRepo);
const controller = new OrderController(service);

orderRouter
  .route("/")
  .get(controller.getAllOrders)
  .post(controller.createOrderFromCart);

orderRouter.route("/:orderId").get(controller.getOrderById);

orderRouter.use("/:orderId/payment", paymentRouter);

export default orderRouter;
