import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { CartService } from "../services/cart.service";
import { CartRepo } from "../repositories/cart.repo";

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
