import { Request, Response } from "express";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { assertAuth } from "../../common/guards/assert-auth";
import { orderService } from "./order.service";
import { createOrderSchema, getOrderByIdSchema } from "./order.validator";

export class OrderController {
  constructor(private readonly orderService: orderService) {}

  public getAllOrders = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const orders = await this.orderService.getAllOrders(req.user.id);

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: { orders },
    });
  });

  public getOrderById = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = getOrderByIdSchema.parse(req);
    const { orderId } = validatedData.params;

    const order = await this.orderService.getOrderById(req.user.id, orderId);

    res.status(200).json({
      status: "success",
      data: { order },
    });
  });

  public createOrderFromCart = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = createOrderSchema.parse(req);
    const { addressId } = validatedData.body;

    const order = await this.orderService.createOrderFromCart(req.user.id, addressId);

    res.status(201).json({
      status: "success",
      data: { order },
    });
  });
}
