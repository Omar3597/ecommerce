import { Router } from "express";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";
import { CartRepo } from "./cart.repo";

const cartRouter = Router();

const cartRepo = new CartRepo();
const cartService = new CartService(cartRepo);

const cartController = new CartController(cartService);

cartRouter
  .route("/")
  .get(cartController.getCart)
  .post(cartController.addItem)
  .delete(cartController.clearCart);

cartRouter
  .route("/:itemId")
  .patch(cartController.updateItem)
  .delete(cartController.removeItem);

export default cartRouter;
