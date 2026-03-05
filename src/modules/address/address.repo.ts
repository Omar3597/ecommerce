import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { CreateAddressInput, UpdateAddressInput } from "./address.validator";

const addressSelect: Prisma.AddressSelect = {
  id: true,
  fullName: true,
  phone: true,
  city: true,
  street: true,
  building: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class AddressRepo {
  public countUserAddresses(userId: string) {
    return prisma.address.count({
      where: { userId },
    });
  }

  public createAddress(userId: string, data: CreateAddressInput) {
    return prisma.address.create({
      data: {
        userId,
        fullName: data.fullName,
        phone: data.phone,
        city: data.city,
        street: data.street,
        building: data.building,
      },
      select: addressSelect,
    });
  }

  public findAllByUserId(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: addressSelect,
    });
  }

  public findByIdAndUserId(addressId: string, userId: string) {
    return prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
      select: addressSelect,
    });
  }

  public findIdByIdAndUserId(addressId: string, userId: string) {
    return prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
      select: { id: true },
    });
  }

  public updateAddress(addressId: string, data: UpdateAddressInput) {
    return prisma.address.update({
      where: { id: addressId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.street !== undefined && { street: data.street }),
        ...(data.building !== undefined && { building: data.building }),
      },
      select: addressSelect,
    });
  }

  public deleteByIdAndUserId(addressId: string, userId: string) {
    return prisma.address.deleteMany({
      where: {
        id: addressId,
        userId,
      },
    });
  }
}
