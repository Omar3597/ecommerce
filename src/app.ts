import express from "express";
import morgan from "morgan";
import cors from "cors";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import { errHandler } from "./common/errors/errHandler";
import { getConfig } from "./config/env";
import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/user/user.routes";
import productRouter from "./modules/product/product.routes";
import cartRouter from "./modules/cart/cart.routes";
import orderRouter from "./modules/order/order.routes";
import reviewRouter from "./modules/review/review.routes";
import adminRouter from "./modules/admin/admin.routes";
import addressRouter from "./modules/address/address.routes";
import productReviewRouter from "./modules/review/productReviews.routes";
import { protect } from "./common/middlewares/protect";
import { paymentWebhookHandler } from "./modules/payment/payment.routes";
import categoryRouter from "./modules/category/category.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(cookieParser());

app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhookHandler,
);

app.use(express.json());

app.use(hpp());

const { env } = getConfig();

if (env == "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", protect, userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", protect, orderRouter);
app.use("/api/v1/reviews", protect, reviewRouter);
app.use("/api/v1/admin", protect, adminRouter);

app.use("/api/v1/users/me/address", protect, addressRouter);
app.use("/api/v1/products/:productId/reviews", productReviewRouter);

app.use("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `canot find ${req.originalUrl} on server!`,
  });
});

app.use(errHandler);

export default app;
