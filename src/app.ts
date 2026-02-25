import express from "express";
import morgan from "morgan";
import cors from "cors";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import { errHandler } from "./common/errors/errHandler";
import { getConfig } from "./config/env";
import userRouter from "./modules/user/user.routes";
import productRouter from "./modules/product/product.routes";
import cartRouter from "./modules/cart/cart.routes";
import orderRouter from "./modules/order/order.routes";
import adminRouter from "./modules/admin/admin.routes";
import { protect } from "./common/middlewares/protect";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(cookieParser());

app.use(express.json());

app.use(hpp());

const { env } = getConfig();

if (env == "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/admin", protect, adminRouter);

app.use("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `canot find ${req.originalUrl} on server!`,
  });
});

app.use(errHandler);

export default app;
