import AppError from "../../common/utils/appError";
import { OrderRepo } from "./order.repo";

type ProductForOrder = {
  id: string;
  name: string;
  summary: string;
  price: number;
  stock: number;
  isHidden: boolean;
};

type RawCartItemForOrder = {
  quantity: number;
  product: ProductForOrder;
};

type ValidCartItemForOrder = {
  quantity: number;
  product: ProductForOrder;
};

type CartForOrder = {
  id: string;
  items: RawCartItemForOrder[];
};

type AddressForSnapshot = {
  fullName: string;
  phone: string;
  city: string;
  street: string;
  building: string | null;
};

export class orderService {
  constructor(private readonly orderRepo: OrderRepo = new OrderRepo()) {}

  async getAllOrders(userId: string) {
    return this.orderRepo.findAllOrdersByUserId(userId);
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.orderRepo.findOrderByIdAndUserId(orderId, userId);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    return order;
  }

  async createOrderFromCart(userId: string, addressId: string) {
    return this.orderRepo.runInTransaction(async (tx) => {
      const cart = await this.loadCart(tx, userId);
      const address = await this.loadAddress(tx, addressId, userId);

      const validItems = this.validateCartItems(cart.items);
      const totals = this.calculateTotals(validItems);
      const orderExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const order = await this.orderRepo.createOrderWithAddressSnapshot(tx, {
        userId,
        address,
        totals,
        orderExpiresAt,
      });

      await this.orderRepo.createOrderItemsWithProductSnapshot(
        tx,
        order.id,
        validItems,
      );
      await this.decrementStockOrThrow(tx, validItems);
      await this.orderRepo.clearCart(tx, cart.id);

      return order;
    });
  }

  private async loadCart(tx: any, userId: string): Promise<CartForOrder> {
    const cart = await this.orderRepo.findCartForOrder(tx, userId);

    if (!cart || cart.items.length === 0) {
      throw new AppError(404, "Cart is empty");
    }

    return cart;
  }

  private async loadAddress(
    tx: any,
    addressId: string,
    userId: string,
  ): Promise<AddressForSnapshot> {
    const address = await this.orderRepo.findAddressForOrder(tx, addressId, userId);

    if (!address) {
      throw new AppError(404, "Address not found");
    }

    return address;
  }

  private validateCartItems(
    items: RawCartItemForOrder[],
  ): ValidCartItemForOrder[] {
    const validItems: ValidCartItemForOrder[] = [];

    for (const item of items) {
      const product = item.product;
      if (!product || product.isHidden) {
        throw new AppError(404, "One or more products are unavailable");
      }
      if (item.quantity > product.stock) {
        throw new AppError(400, `Not enough stock for: ${product.name}`);
      }

      validItems.push({ quantity: item.quantity, product });
    }

    return validItems;
  }

  private calculateTotals(items: ValidCartItemForOrder[]) {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    const shippingFee = 0;
    const total = subtotal + shippingFee;

    return { subtotal, shippingFee, total };
  }

  private async decrementStockOrThrow(tx: any, items: ValidCartItemForOrder[]) {
    for (const item of items) {
      const updated = await this.orderRepo.updateProductStockForOrder(
        tx,
        item.product.id,
        item.quantity,
      );

      if (updated.count !== 1) {
        throw new AppError(409, "Stock changed. Please refresh your cart");
      }
    }
  }
}
