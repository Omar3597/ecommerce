import express from "express";
import { AddressService } from "./address.service";
import { AddressController } from "./address.controller";

const router = express.Router();

const addressService = new AddressService();
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
