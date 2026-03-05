import { Router } from "express";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";
import { CartRepo } from "./cart.repo";
import { protect } from "../../common/middlewares/protect";

const router = Router();

const cartRepo = new CartRepo();
const cartService = new CartService(cartRepo);

const cartController = new CartController(cartService);

router.use(protect);

router
  .route("/")
  .get(cartController.getCart)
  .post(cartController.addItem)
  .delete(cartController.clearCart);

router
  .route("/:itemId")
  .patch(cartController.updateItem)
  .delete(cartController.removeItem);

export default router;
