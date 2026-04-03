import { Request, Response } from "express";
import { UserService } from "./user.service";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { assertAuth } from "../../common/guards/assert-auth";
import {
  requestEmailChangeSchema,
  updateProfileSchema,
  updatePasswordSchema,
  verifyEmailChangeSchema,
} from "./user.validator";
import { toPublicUser } from "./user.dto";

export class UserController {
  constructor(private readonly userService: UserService) {}

  public updateProfile = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = updateProfileSchema.parse(req);

    const user = await this.userService.updateProfile(
      req.user,
      validatedData.body,
    );

    res.status(200).json({
      status: "success",
      data: { user: toPublicUser(user) },
    });
  });

  public getMe = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    res.status(200).json({
      status: "success",
      data: { user: toPublicUser(req.user) },
    });
  });

  public updatePassword = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = updatePasswordSchema.parse(req);

    await this.userService.updatePassword(req.user, validatedData.body);

    res.status(200).json({
      status: "success",
      message:
        "Password has been updated successfully. You can now log in with your new password.",
    });
  });

  public requestEmailChange = catchAsync(
    async (req: Request, res: Response) => {
      assertAuth(req);

      const validatedData = requestEmailChangeSchema.parse(req);

      await this.userService.requestEmailChange(req.user, validatedData.body);

      res.status(200).json({
        status: "success",
        message: "Verification link sent to your new email address.",
      });
    },
  );

  public verifyEmailChange = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = verifyEmailChangeSchema.parse(req);

    await this.userService.verifyEmailChange(req.user, validatedData.params);

    res.status(200).json({
      status: "success",
      message: "Email has been updated successfully.",
    });
  });
}
