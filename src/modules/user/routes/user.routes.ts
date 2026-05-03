import { Router } from "express";
import { UserService } from "../services/user.service";
import { UserController } from "../controllers/user.controller";
import { UserRepo } from "../repositories/user.repo";
import { AuthEmailTokenService } from "../../../common/services/emailToken.service";
import { prisma } from "../../../lib/prisma";

const userRouter = Router();

const userRepo = new UserRepo();
const authEmailTokenService = new AuthEmailTokenService(prisma);
const userService = new UserService(userRepo, authEmailTokenService);
const userController = new UserController(userService);

const meRouter = Router();

meRouter.get("/", userController.getMe);
meRouter.patch("/profile", userController.updateProfile);
meRouter.patch("/password", userController.updatePassword);
meRouter.post("/email-change", userController.requestEmailChange);
meRouter.post("/email-change/verify/:token", userController.verifyEmailChange);

userRouter.use("/me", meRouter);

export default userRouter;
