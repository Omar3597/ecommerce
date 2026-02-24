import express from "express";
import authRouter from "./auth/auth.routes";
import addressRouter from "./../address/address.routes";
import { protect } from "../../common/middlewares/protect";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);

router.use("/auth", authRouter);

const meRouter = express.Router();

meRouter.get("/", userController.getMe);
meRouter.patch("/profile", userController.updateProfile);
meRouter.patch("/password", userController.updatePassword);
meRouter.post("/email-change", userController.requestEmailChange);
meRouter.get("/email-change/verify/:token", userController.verifyEmailChange);
meRouter.use("/address", addressRouter);

router.use("/me", protect, meRouter);

export default router;
