import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { IdentityService } from "../services/identity.service";
import { SessionService } from "../services/session.service";
import { PasswordService } from "../services/password.service";
import { protect } from "../../../middlewares/protect";
import { AuthRepo } from "../repositories/auth.repo";

const authRouter = Router();

const authRepo = new AuthRepo();
const identityService = new IdentityService(authRepo);
const sessionService = new SessionService(authRepo);
const passwordService = new PasswordService(authRepo);
const authController = new AuthController(identityService, sessionService, passwordService);

authRouter.post("/register", authController.createUser);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.getrefreshToken);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password/:token", authController.resetPassword);
authRouter.post("/verify-email/:token", authController.verifyEmail);
authRouter.post("/logout", protect, authController.logout);
authRouter.post("/logout-all", protect, authController.logoutFromAllDevices);

export default authRouter;
