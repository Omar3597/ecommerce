import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { CartService } from "../services/cart.service";
import { CartRepo } from "../repositories/cart.repo";
import { userLimiter } from "../../../middlewares/rateLimit";

const cartRouter = Router();

const cartRepo = new CartRepo();
const cartService = new CartService(cartRepo);

const cartController = new CartController(cartService);

cartRouter
  .route("/")
  .get(userLimiter, cartController.getCart)
  .post(userLimiter, cartController.addItem)
  .delete(userLimiter, cartController.clearCart);

cartRouter
  .route("/:itemId")
  .patch(userLimiter, cartController.updateItem)
  .delete(userLimiter, cartController.removeItem);

export default cartRouter;
