import { EmailService } from "../shared/services/email/email.service";
import { CloudStorageService } from "../shared/services/cloudStorage/services/cloudStorage.service";
import { OrderExpirationService } from "../modules/order";
import { CartCleanupService } from "../modules/cart";
import { ShippingSimulatorService } from "../modules/order";
import { OrphanImagesCleanupService } from "../modules/product";
import { TokensCleanupService } from "../modules/auth";
import { UserCleanupService } from "../modules/user";

export interface IServices {
  emailService: EmailService;
  cloudStorageService: CloudStorageService;
  expirationService: OrderExpirationService;
  cartCleanupService: CartCleanupService;
  shippingSimulatorService: ShippingSimulatorService;
  orphanImagesCleanupService: OrphanImagesCleanupService;
  tokensCleanupService: TokensCleanupService;
  userCleanupService: UserCleanupService;
}
