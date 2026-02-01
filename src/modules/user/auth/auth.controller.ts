import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { catchAsync } from "../../../common/middlewares/catchAsync";
import { signupSchema, loginSchema, forgotPasswordSchema } from "./auth.dto";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private sendRefreshTokenCookie(res: Response, token: string) {
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    res.cookie("refreshToken", token, cookieOptions);
  }

  public createUser = catchAsync(async (req: Request, res: Response) => {
    const validatedData = signupSchema.parse(req.body);

    const user = await this.authService.registerUser(validatedData);

    res.status(201).json({
      status: "success",
      data: { user },
    });
  });

  public login = catchAsync(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);

    const { user, accessToken, refreshToken } =
      await this.authService.loginWithEmailAndPassword(validatedData);

    this.sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      status: "success",
      data: {
        user,
        accessToken,
      },
    });
  });

  public getrefreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    const { user, accessToken } = await this.authService.refresh(refreshToken);

    res.status(200).json({
      status: "success",
      data: {
        user,
        accessToken,
      },
    });
  });

  public forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const validatedData = forgotPasswordSchema.parse(req.body);

    await this.authService.forgotPassword(validatedData);

    res.status(200).json({
      status: "success",
      message:
        "If an account with that email exists, a reset link will be sent.",
    });
  });
}
