import express from "express";
import { protect } from "../../common/middlewares/protect";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);

const meRouter = express.Router();

meRouter.get("/", userController.getMe);
meRouter.patch("/profile", userController.updateProfile);
meRouter.patch("/password", userController.updatePassword);
meRouter.post("/email-change", userController.requestEmailChange);
meRouter.get("/email-change/verify/:token", userController.verifyEmailChange);

router.use("/me", protect, meRouter);

export default router;
