import express from "express";
import authRouter from "./auth/auth.routes";
import { protect } from "../../common/middlewares/protect";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

const router = express.Router();

const userService = new UserService();
const userController = new UserController(userService);

router.use("/auth", authRouter);

router.use(protect);

router.get("/me", userController.getMe);
router.patch("/me/update-profile", userController.updateProfile);

export default router;
