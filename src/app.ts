import express from "express";
import morgan from "morgan";
import { errHandler } from "./common/errors/error";
import { getConfig } from "./config/config";

const app = express();

app.use(express.json());

const { env } = getConfig();

if (env == "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/users");
app.use("/api/v1/products");
app.use("/api/v1/orders");

app.use("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `canot find ${req.originalUrl} on server!`,
  });
});

app.use(errHandler);

export default app;
