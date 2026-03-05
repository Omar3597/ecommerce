import { Request, Response } from "express";
import { catchAsync } from "../../common/middlewares/catchAsync";
import { assertAuth } from "../../common/guards/assert-auth";
import { AddressService } from "./address.service";
import {
  createAddressSchema,
  deleteAddressSchema,
  getAddressSchema,
  updateAddressSchema,
} from "./address.validator";
import { toAddressResponse, toAddressesResponse } from "./address.dto";

export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  public createAddress = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

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

  public getAllAddresses = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const addresses = await this.addressService.getAllAddresses(req.user.id);
    const publicAddresses = toAddressesResponse(addresses);

    res.status(200).json({
      status: "success",
      results: publicAddresses.length,
      data: { addresses: publicAddresses },
    });
  });

  public getAddress = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

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

  public updateAddress = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

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

  public deleteAddress = catchAsync(async (req: Request, res: Response) => {
    assertAuth(req);

    const validatedData = deleteAddressSchema.parse(req);

    await this.addressService.deleteAddress(
      req.user.id,
      validatedData.params.addressId,
    );

    res.status(204).send();
  });
}
