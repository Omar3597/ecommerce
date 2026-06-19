import { Router } from "express";
import { UserService } from "../services/user.service";
import { UserController } from "../controllers/user.controller";
import { UserRepo } from "../repositories/user.repo";
import { authLimiter, userLimiter } from "../../../middlewares/rateLimit";

const userRouter = Router();

const userRepo = new UserRepo();
const userService = new UserService(userRepo);
const userController = new UserController(userService);

const meRouter = Router();

meRouter.get("/", userLimiter, userController.getMe);
meRouter.patch("/profile", userLimiter, userController.updateProfile);
meRouter.patch("/password", authLimiter, userController.updatePassword);
meRouter.post("/email-change", authLimiter, userController.requestEmailChange);
meRouter.post("/email-change/verify/:token", authLimiter, userController.verifyEmailChange);

userRouter.use("/me", meRouter);

export default userRouter;
