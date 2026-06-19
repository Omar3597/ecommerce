import { Router } from "express";
import { AddressService } from "../services/address.service";
import { AddressController } from "../controllers/address.controller";
import { AddressRepo } from "../repositories/address.repo";
import { userLimiter } from "../../../middlewares/rateLimit";

const addressRouter = Router();

const addressRepo = new AddressRepo();
const addressService = new AddressService(addressRepo);
const addressController = new AddressController(addressService);

addressRouter
  .route("/")
  .post(userLimiter, addressController.createAddress)
  .get(userLimiter, addressController.getAllAddresses);

addressRouter
  .route("/:addressId")
  .get(userLimiter, addressController.getAddress)
  .patch(userLimiter, addressController.updateAddress)
  .delete(userLimiter, addressController.deleteAddress);

export default addressRouter;
