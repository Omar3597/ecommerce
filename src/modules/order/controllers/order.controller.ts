import { Response } from "express";
import { catchAsync } from "../../../common/middlewares/catchAsync";
import { AuthRequest } from "../../../common/types/auth.types";
import { OrderService } from "../services/order.service";
import {
  createOrderSchema,
  getOrderByIdSchema,
} from "../validators/order.validator";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  public getAllOrders = catchAsync(async (req: AuthRequest, res: Response) => {
    const orders = await this.orderService.getAllOrders(req.user.id);

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: { orders },
    });
  });

  public getOrderById = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = getOrderByIdSchema.parse(req);
    const { orderId } = validatedData.params;

    const order = await this.orderService.getOrderById(req.user.id, orderId);

    res.status(200).json({
      status: "success",
      data: { order },
    });
  });

  public createOrderFromCart = catchAsync(
    async (req: AuthRequest, res: Response) => {
      const validatedData = createOrderSchema.parse(req);
      const { addressId } = validatedData.body;

      const order = await this.orderService.createOrderFromCart(
        req.user.id,
        addressId,
      );

      res.status(201).json({
        status: "success",
        data: { order },
      });
    },
  );
}
