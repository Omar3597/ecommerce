import express from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { protect } from "../../common/middlewares/protect";
import { AuthRepo } from "./auth.repo";
import { AuthEmailTokenService } from "../../common/services/email-token.service";
import { prisma } from "../../lib/prisma";

const router = express.Router({ mergeParams: true });

const authRepo = new AuthRepo();
const authEmailTokenService = new AuthEmailTokenService(prisma);
const authService = new AuthService(authRepo, authEmailTokenService);
const authController = new AuthController(authService);

router.post("/register", authController.createUser);
router.post("/login", authController.login);
router.post("/refresh", authController.getrefreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.post("/verify-email/:token", authController.verifyEmail);
router.post("/logout", protect, authController.logout);
router.post("/logout-all", protect, authController.logoutFromAllDevices);

export default router;
