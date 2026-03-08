import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const orderWithSnapshotsSelect: Prisma.OrderSelect = {
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
      quantity: true,
      productSnapshot: {
        select: {
          id: true,
          name: true,
          summary: true,
          price: true,
        },
      },
    },
    orderBy: { id: "asc" },
  },
} as const;

type Tx = Prisma.TransactionClient;

type AddressSnapshotInput = {
  fullName: string;
  phone: string;
  city: string;
  street: string;
  building: string | null;
};

type OrderTotalsInput = {
  subtotal: number;
  shippingFee: number;
  total: number;
};

type OrderItemInput = {
  quantity: number;
  product: {
    id: string;
    name: string;
    summary: string;
    price: number;
  };
};

export class OrderRepo {
  public findAllOrdersByUserId(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: orderWithSnapshotsSelect,
    });
  }

  public findOrderByIdAndUserId(orderId: string, userId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, userId },
      select: orderWithSnapshotsSelect,
    });
  }

  public runInTransaction<T>(fn: (tx: Tx) => Promise<T>) {
    return prisma.$transaction(fn);
  }

  public findCartForOrder(tx: Tx, userId: string) {
    return tx.cart.findUnique({
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
                summary: true,
                price: true,
                stock: true,
                isHidden: true,
              },
            },
          },
        },
      },
    });
  }

  public findAddressForOrder(tx: Tx, addressId: string, userId: string) {
    return tx.address.findFirst({
      where: { id: addressId, userId },
      select: {
        fullName: true,
        phone: true,
        city: true,
        street: true,
        building: true,
      },
    });
  }

  public createOrderWithAddressSnapshot(
    tx: Tx,
    {
      userId,
      address,
      totals,
      orderExpiresAt,
    }: {
      userId: string;
      address: AddressSnapshotInput;
      totals: OrderTotalsInput;
      orderExpiresAt: Date;
    },
  ) {
    return tx.order.create({
      data: {
        userId,
        status: "PENDING",
        subtotal: totals.subtotal,
        shippingFee: totals.shippingFee,
        total: totals.total,
        addressSnapshot: {
          create: {
            fullName: address.fullName,
            phone: address.phone,
            city: address.city,
            street: address.street,
            building: address.building,
          },
        },
        expiresAt: orderExpiresAt,
      },
      select: { id: true, status: true, total: true, createdAt: true },
    });
  }

  public async createOrderItemsWithProductSnapshot(
    tx: Tx,
    orderId: string,
    items: OrderItemInput[],
  ) {
    const snapshots = await Promise.all(
      items.map((item) =>
        tx.orderedProductSnapshot.create({
          data: {
            name: item.product.name,
            summary: item.product.summary,
            price: item.product.price,
          },
          select: { id: true },
        }),
      ),
    );

    await tx.orderItem.createMany({
      data: items.map((item, index) => ({
        orderId,
        productSnapshotId: snapshots[index].id,
        productId: item.product.id,
        quantity: item.quantity,
      })),
    });
  }

  public updateProductStockForOrder(
    tx: Tx,
    productId: string,
    quantity: number,
  ) {
    return tx.product.updateMany({
      where: {
        id: productId,
        isHidden: false,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity },
        soldQuantity: { increment: quantity },
      },
    });
  }

  public clearCart(tx: Tx, cartId: string) {
    return tx.cartItem.deleteMany({ where: { cartId } });
  }
}
