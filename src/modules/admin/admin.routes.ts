import express from "express";
import adminProductRouter from "./routes/admin.product.routes";

const router = express.Router();

router.use("/products", adminProductRouter);

export default router;
