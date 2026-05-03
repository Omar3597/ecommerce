import { Router } from "express";
import { AddressService } from "../services/address.service";
import { AddressController } from "../controllers/address.controller";
import { AddressRepo } from "../repositories/address.repo";

const addressRouter = Router();

const addressRepo = new AddressRepo();
const addressService = new AddressService(addressRepo);
const addressController = new AddressController(addressService);

addressRouter
  .route("/")
  .post(addressController.createAddress)
  .get(addressController.getAllAddresses);

addressRouter
  .route("/:addressId")
  .get(addressController.getAddress)
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

export default addressRouter;
