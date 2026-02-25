import { Request, Response } from "express";
import AppError from "../../common/utils/appError";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { assertAuth } from "../../common/guards/assert-auth";
import { orderService } from "./order.service";

export class OrderController {
  constructor(private readonly orderService: orderService) {}

  public createOrderFromCart = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const { addressId } = req.body as { addressId?: string };

    if (!addressId || typeof addressId !== "string") {
      throw new AppError(400, "addressId is required");
    }

    const order = await this.orderService.createOrderFromCart(req.user.id, addressId);

    res.status(201).json({
      status: "success",
      data: { order },
    });
  });
}
