import { Router } from "express";
import { UserService } from "../services/user.service";
import { UserController } from "../controllers/user.controller";
import { UserRepo } from "../repositories/user.repo";

const userRouter = Router();

const userRepo = new UserRepo();
const userService = new UserService(userRepo);
const userController = new UserController(userService);

const meRouter = Router();

meRouter.get("/", userController.getMe);
meRouter.patch("/profile", userController.updateProfile);
meRouter.patch("/password", userController.updatePassword);
meRouter.post("/email-change", userController.requestEmailChange);
meRouter.post("/email-change/verify/:token", userController.verifyEmailChange);

userRouter.use("/me", meRouter);

export default userRouter;
