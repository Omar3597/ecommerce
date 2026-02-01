import express, { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const router = express.Router({ mergeParams: true });

const authService = new AuthService();
const authController = new AuthController(authService);

router.post("/register", authController.createUser);
router.post("/login", authController.login);
router.post("/refresh", authController.getrefreshToken);
router.post("/forgot-password", authController.forgotPassword);

export default router;
