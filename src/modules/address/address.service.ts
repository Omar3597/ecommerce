import AppError from "../../common/utils/appError";
import { CreateAddressInput, UpdateAddressInput } from "./address.validator";
import { AddressRepo } from "./address.repo";

export class AddressService {
  constructor(private readonly addressRepo: AddressRepo = new AddressRepo()) {}

  async createAddress(userId: string, data: CreateAddressInput) {
    const addressesCount = await this.addressRepo.countUserAddresses(userId);

    if (addressesCount >= 3) {
      throw new AppError(400, "Maximum 3 addresses allowed per user");
    }

    return this.addressRepo.createAddress(userId, data);
  }

  async getAllAddresses(userId: string) {
    return this.addressRepo.findAllByUserId(userId);
  }

  async getAddressById(userId: string, addressId: string) {
    const address = await this.addressRepo.findByIdAndUserId(addressId, userId);

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
    const existingAddress = await this.addressRepo.findIdByIdAndUserId(
      addressId,
      userId,
    );

    if (!existingAddress) {
      throw new AppError(404, "Address not found");
    }

    return this.addressRepo.updateAddress(existingAddress.id, data);
  }

  async deleteAddress(userId: string, addressId: string) {
    const deleted = await this.addressRepo.deleteByIdAndUserId(
      addressId,
      userId,
    );

    if (deleted.count === 0) {
      throw new AppError(404, "Address not found");
    }
  }
}
