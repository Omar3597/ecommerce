import { Request, Response } from "express";
import { UserService } from "./user.service";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { assertAuth } from "../../common/guards/assert-auth";
import { updateProfileSchema, updatePasswordSchema } from "./user.validator";
import { PublicUserDto } from "./user.dto";

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
      data: PublicUserDto.parse(user),
    });
  });

  public getMe = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    res.status(200).json({
      status: "success",
      data: PublicUserDto.parse(req.user),
    });
  });

  public updatePassword = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = updatePasswordSchema.parse(req);

    const user = await this.userService.updatePassword(
      req.user,
      validatedData.body,
    );

    res.status(200).json({
      status: "success",
      data: PublicUserDto.parse(user),
    });
  });
}
