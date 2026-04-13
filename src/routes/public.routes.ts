import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import userRouter from "../modules/user/user.routes";
import productRouter from "../modules/product/product.public.routes";
import cartRouter from "../modules/cart/cart.routes";
import orderRouter from "../modules/order/order.routes";
import reviewRouter from "../modules/review/review.routes";
import addressRouter from "../modules/address/address.routes";
import productReviewRouter from "../modules/review/productReviews.routes";
import categoryRouter from "../modules/category/category.public.routes";
import { protect } from "../common/middlewares/protect";

const publicRouter = Router();

publicRouter.use("/auth", authRouter);
publicRouter.use("/users", protect ,userRouter);
publicRouter.use("/products", productRouter);
publicRouter.use("/categories", categoryRouter);
publicRouter.use("/cart", protect, cartRouter);
publicRouter.use("/orders", protect, orderRouter);
publicRouter.use("/reviews", protect, reviewRouter);

publicRouter.use("/users/me/address", protect, addressRouter);
publicRouter.use("/products/:productId/reviews", productReviewRouter);

export default publicRouter;