import AppError from "../../common/utils/appError";
import { prisma } from "../../lib/prisma";

type ProductForOrder = {
  id: string;
  name: string;
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

const orderWithSnapshotsSelect = {
  id: true,
  status: true,
  subtotal: true,
  shippingFee: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  addressSnapshot: {
    select: {
      fullName: true,
      phone: true,
      city: true,
      street: true,
      building: true,
    },
  },
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      priceSnapshot: true,
      nameSnapshot: true,
    },
    orderBy: { id: "asc" },
  },
} as const;

export class orderService {
  async getAllOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: orderWithSnapshotsSelect,
    });

    return orders;
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: orderWithSnapshotsSelect,
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    return order;
  }

  async createOrderFromCart(userId: string, addressId: string) {
    return await prisma.$transaction(async (tx) => {
      const cart = await this.loadCart(tx, userId);
      const address = await this.loadAddress(tx, addressId, userId);

      const validItems = this.validateCartItems(cart.items);

      const { subtotal, shippingFee, total } = this.calculateTotals(validItems);
      const order = await this.createOrderWithAddressSnapshot(
        tx,
        userId,
        address,
        subtotal,
        shippingFee,
        total,
      );

      await this.createOrderItems(tx, order.id, validItems);
      await this.decrementStockOrThrow(tx, validItems);
      await this.clearCart(tx, cart.id);

      return order;
    });
  }

  private async loadCart(tx: any, userId: string): Promise<CartForOrder> {
    const cart = await tx.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                isHidden: true,
              },
            },
          },
        },
      },
    });

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
    const address = await tx.address.findUnique({
      where: { id: addressId, userId },
      select: {
        fullName: true,
        phone: true,
        city: true,
        street: true,
        building: true,
      },
    });

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

  private async createOrderWithAddressSnapshot(
    tx: any,
    userId: string,
    address: AddressForSnapshot,
    subtotal: number,
    shippingFee: number,
    total: number,
  ) {
    return await tx.order.create({
      data: {
        userId,
        status: "PENDING",
        subtotal,
        shippingFee,
        total,
        addressSnapshot: {
          create: {
            fullName: address.fullName,
            phone: address.phone,
            city: address.city,
            street: address.street,
            building: address.building,
          },
        },
      },
      select: { id: true, status: true, total: true, createdAt: true },
    });
  }

  private async createOrderItems(
    tx: any,
    orderId: string,
    items: ValidCartItemForOrder[],
  ) {
    await tx.orderItem.createMany({
      data: items.map((item) => ({
        orderId,
        productId: item.product.id,
        quantity: item.quantity,
        priceSnapshot: item.product.price,
        nameSnapshot: item.product.name,
      })),
    });
  }

  private async decrementStockOrThrow(tx: any, items: ValidCartItemForOrder[]) {
    for (const item of items) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.product.id,
          isHidden: false,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
          soldQuantity: { increment: item.quantity },
        },
      });

      if (updated.count !== 1) {
        throw new AppError(409, "Stock changed. Please refresh your cart");
      }
    }
  }

  private async clearCart(tx: any, cartId: string) {
    await tx.cartItem.deleteMany({ where: { cartId } });
  }
}
