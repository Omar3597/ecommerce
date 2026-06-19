import { Router } from "express";
import { authRouter } from "../modules/auth";
import { userRouter } from "../modules/user";
import { publicProductRouter } from "../modules/product";
import { cartRouter } from "../modules/cart";
import { orderRouter } from "../modules/order";
import { reviewRouter } from "../modules/review";
import { addressRouter } from "../modules/address";
import { productReviewRouter } from "../modules/review";
import { publicCategoryRouter } from "../modules/category";
import { protect } from "../middlewares/protect";
import { browseLimiter } from "../middlewares/rateLimit";

const publicRouter = Router();

publicRouter.use("/auth", authRouter);
publicRouter.use("/users", protect, userRouter);
publicRouter.use("/products", browseLimiter, publicProductRouter);
publicRouter.use("/categories", browseLimiter, publicCategoryRouter);
publicRouter.use("/cart", protect, cartRouter);
publicRouter.use("/orders", protect, orderRouter);
publicRouter.use("/reviews", protect, reviewRouter);

publicRouter.use("/users/me/address", protect, addressRouter);
publicRouter.use("/products/:productId/reviews", browseLimiter, productReviewRouter);

export default publicRouter;
