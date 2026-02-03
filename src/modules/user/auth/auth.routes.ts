import express, { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { protect } from "../../../common/middlewares/protect";

const router = express.Router({ mergeParams: true });

const authService = new AuthService();
const authController = new AuthController(authService);

router.post("/register", authController.createUser);
router.post("/login", authController.login);
router.post("/refresh", authController.getrefreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.post("/verify-email/:token", authController.verifyEmail);
router.post("/logout", protect, authController.logout);

export default router;
