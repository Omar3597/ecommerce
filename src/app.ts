import express from "express";
import cors from "cors";
import crypto from "crypto";
import pinoHttp from "pino-http";
import logger, { requestContext } from "./config/logger";
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

const httpLogger = pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    return "info";
  },
  customSuccessMessage: function (req, res) {
    return `[HTTP Traffic] ${req.method} ${req.url} - Status: ${res.statusCode}`;
  },
  customErrorMessage: function (req, res, err) {
    return `[HTTP Traffic] ${req.method} ${req.url} - Status: ${res.statusCode}`;
  },
  serializers: {
    req: (req) => {
      return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        params: req.params,
      };
    },
    res: (res) => {
      return {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      };
    },
  },
});

app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.id = requestId;
  requestContext.run({ requestId }, () => {
    httpLogger(req, res, next);
  });
});

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
