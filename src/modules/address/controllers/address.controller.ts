import { Response } from "express";
import { catchAsync } from "../../../common/middlewares/catchAsync";
import { AuthRequest } from "../../../common/types/auth.types";
import { AddressService } from "../services/address.service";
import {
  createAddressSchema,
  deleteAddressSchema,
  getAddressSchema,
  updateAddressSchema,
} from "../validators/address.validator";
import { toAddressResponse, toAddressesResponse } from "../dtos/address.dto";

export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  public createAddress = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = createAddressSchema.parse(req);

    const address = await this.addressService.createAddress(
      req.user.id,
      validatedData.body,
    );
    const publicAddress = toAddressResponse(address);

    res.status(201).json({
      status: "success",
      data: { address: publicAddress },
    });
  });

  public getAllAddresses = catchAsync(
    async (req: AuthRequest, res: Response) => {
      const addresses = await this.addressService.getAllAddresses(req.user.id);
      const publicAddresses = toAddressesResponse(addresses);

      res.status(200).json({
        status: "success",
        results: publicAddresses.length,
        data: { addresses: publicAddresses },
      });
    },
  );

  public getAddress = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = getAddressSchema.parse(req);

    const address = await this.addressService.getAddressById(
      req.user.id,
      validatedData.params.addressId,
    );
    const publicAddress = toAddressResponse(address);

    res.status(200).json({
      status: "success",
      data: { address: publicAddress },
    });
  });

  public updateAddress = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = updateAddressSchema.parse(req);

    const address = await this.addressService.updateAddress(
      req.user.id,
      validatedData.params.addressId,
      validatedData.body,
    );
    const publicAddress = toAddressResponse(address);

    res.status(200).json({
      status: "success",
      data: { address: publicAddress },
    });
  });

  public deleteAddress = catchAsync(async (req: AuthRequest, res: Response) => {
    const validatedData = deleteAddressSchema.parse(req);

    await this.addressService.deleteAddress(
      req.user.id,
      validatedData.params.addressId,
    );

    res.status(204).send();
  });
}
