import express from "express";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { UserRepo } from "./user.repo";
import { AuthEmailTokenService } from "../../common/services/email-token.service";
import { prisma } from "../../lib/prisma";

const router = express.Router();
const userRepo = new UserRepo();
const authEmailTokenService = new AuthEmailTokenService(prisma);
const userService = new UserService(userRepo, authEmailTokenService);
const userController = new UserController(userService);

const meRouter = express.Router();

meRouter.get("/", userController.getMe);
meRouter.patch("/profile", userController.updateProfile);
meRouter.patch("/password", userController.updatePassword);
meRouter.post("/email-change", userController.requestEmailChange);
meRouter.get("/email-change/verify/:token", userController.verifyEmailChange);

router.use("/me", meRouter);

export default router;
