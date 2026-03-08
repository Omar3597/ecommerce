import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { catchAsync } from "../../common/middlewares/catchAsync";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  passwordResetSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} from "./auth.validator";
import { toPublicUser } from "./auth.dto";
import { assertAuth } from "../../common/guards/assert-auth";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private sendRefreshTokenCookie(res: Response, token: string) {
    const cookieOptions = {
      expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    res.cookie("refreshToken", token, cookieOptions);
  }

  private clearRefreshTokenCookie(res: Response) {
    res.cookie("refreshToken", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
    });
  }

  public createUser = catchAsync(async (req: Request, res: Response) => {
    const validatedData = signupSchema.parse(req);

    const user = await this.authService.registerUser(validatedData.body);

    res.status(201).json({
      status: "success",
      data: toPublicUser(user),
    });
  });

  public login = catchAsync(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req);

    const { user, accessToken, refreshToken } =
      await this.authService.loginWithEmailAndPassword(validatedData.body);

    this.sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      status: "success",
      data: {
        user: toPublicUser(user),
        accessToken,
      },
    });
  });

  public getrefreshToken = catchAsync(async (req: Request, res: Response) => {
    const validatedData = refreshTokenSchema.parse(req);

    const { refreshToken } = validatedData.cookies;

    const result = await this.authService.rotateRefreshToken(refreshToken);

    this.sendRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      status: "success",
      data: {
        user: toPublicUser(result.user),
        accessToken: result.accessToken,
      },
    });
  });

  public forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const validatedData = forgotPasswordSchema.parse(req);

    await this.authService.forgotPassword(validatedData.body);

    res.status(200).json({
      status: "success",
      message:
        "If an account with that email exists, a reset link will be sent.",
    });
  });

  public resetPassword = catchAsync(async (req: Request, res: Response) => {
    const validatedData = passwordResetSchema.parse(req);

    const { password } = validatedData.body;
    const { token } = validatedData.params;

    await this.authService.resetPassword(token, password);

    res.status(200).json({
      status: "success",
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  });

  public verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const validatedData = verifyEmailSchema.parse(req);

    const { token } = validatedData.params;

    await this.authService.verifyEmail(token);

    res.status(200).json({
      status: "success",
      message:
        "Email verified successfully! You can now use all features of the system.",
    });
  });

  public logout = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = refreshTokenSchema.parse(req);

    const { refreshToken } = validatedData.cookies;

    await this.authService.logout(refreshToken);
    this.clearRefreshTokenCookie(res);

    res.status(204).send();
  });

  public logoutFromAllDevices = catchAsync(
    async (req: Request, res: Response) => {
      assertAuth(req);

      await this.authService.logoutFromAllDevices(req.user.id);
      this.clearRefreshTokenCookie(res);

      res.status(204).send();
    },
  );
}
