import { Request, Response } from "express";
import { UserService } from "./user.service";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { assertAuth } from "../../common/guards/assert-auth";
import { PublicUserDto } from "./user.dto";

export class UserController {
  constructor(private readonly userService: UserService) {}

  public getMe = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    res.status(200).json({
      status: "success",
      data: PublicUserDto.parse(req.user),
    });
  });
}
