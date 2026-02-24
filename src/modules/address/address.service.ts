import AppError from "../../common/utils/appError";
import { prisma } from "../../lib/prisma";
import { CreateAddressInput, UpdateAddressInput } from "./address.validator";

const addressSelect = {
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

export class AddressService {
  async createAddress(userId: string, data: CreateAddressInput) {
    const addressesCount = await prisma.address.count({
      where: { userId },
    });

    if (addressesCount >= 3) {
      throw new AppError(400, "Maximum 3 addresses allowed per user");
    }

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

  async getAllAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: addressSelect,
    });
  }

  async getAddressById(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
      select: addressSelect,
    });

    if (!address) {
      throw new AppError(404, "Address not found");
    }

    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressInput,
  ) {
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
      select: { id: true },
    });

    if (!existingAddress) {
      throw new AppError(404, "Address not found");
    }

    return prisma.address.update({
      where: { id: existingAddress.id },
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

  async deleteAddress(userId: string, addressId: string) {
    const deleted = await prisma.address.deleteMany({
      where: {
        id: addressId,
        userId,
      },
    });

    if (deleted.count === 0) {
      throw new AppError(404, "Address not found");
    }
  }
}
