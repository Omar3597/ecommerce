import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { IdentityService } from "../services/identity.service";
import { SessionService } from "../services/session.service";
import { PasswordService } from "../services/password.service";
import { protect } from "../../../middlewares/protect";
import { AuthRepo } from "../repositories/auth.repo";
import { authLimiter } from "../../../middlewares/rateLimit";

const authRouter = Router();

const authRepo = new AuthRepo();
const identityService = new IdentityService(authRepo);
const sessionService = new SessionService(authRepo);
const passwordService = new PasswordService(authRepo);
const authController = new AuthController(identityService, sessionService, passwordService);

authRouter.post("/register", authLimiter, authController.createUser);
authRouter.post("/login", authLimiter, authController.login);
authRouter.post("/refresh", authLimiter, authController.getrefreshToken);
authRouter.post("/forgot-password", authLimiter, authController.forgotPassword);
authRouter.post("/reset-password/:token", authLimiter, authController.resetPassword);
authRouter.post("/verify-email/:token", authLimiter, authController.verifyEmail);
authRouter.post("/logout", protect, authController.logout);
authRouter.post("/logout-all", protect, authController.logoutFromAllDevices);

export default authRouter;
