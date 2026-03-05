import { Router } from "express";
import { AddressService } from "./address.service";
import { AddressController } from "./address.controller";
import { AddressRepo } from "./address.repo";

const router = Router();

const addressRepo = new AddressRepo();
const addressService = new AddressService(addressRepo);
const addressController = new AddressController(addressService);

router
  .route("/")
  .post(addressController.createAddress)
  .get(addressController.getAllAddresses);

router
  .route("/:addressId")
  .get(addressController.getAddress)
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

export default router;
