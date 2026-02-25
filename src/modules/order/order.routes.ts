import { Router } from "express";
import { protect } from "../../common/middlewares/protect";
import { orderService } from "./order.service";
import { OrderController } from "./order.controller";

const router = Router();

const service = new orderService();
const controller = new OrderController(service);

router.use(protect);

router.route("/").post(controller.createOrderFromCart);

export default router;
