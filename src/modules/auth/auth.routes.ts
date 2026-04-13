import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { protect } from "../../common/middlewares/protect";
import { AuthRepo } from "./auth.repo";
import { AuthEmailTokenService } from "../../common/services/email-token.service";
import { prisma } from "../../lib/prisma";

const authRouter = Router();

const authRepo = new AuthRepo();
const authEmailTokenService = new AuthEmailTokenService(prisma);
const authService = new AuthService(authRepo, authEmailTokenService);
const authController = new AuthController(authService);

authRouter.post("/register", authController.createUser);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.getrefreshToken);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password/:token", authController.resetPassword);
authRouter.post("/verify-email/:token", authController.verifyEmail);
authRouter.post("/logout", protect, authController.logout);
authRouter.post("/logout-all", protect, authController.logoutFromAllDevices);

export default authRouter;
