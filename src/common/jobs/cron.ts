import { cleanupExpiredOrders } from "./handlers/cleanupOrders";
import { cleanupExpiredTokens } from "./handlers/cleanupTokens";
import { cleanupStaleCarts } from "./handlers/cleanupCarts";
import { cleanupUnverifiedUsers } from "./handlers/cleanupUsers";
import { runShippingSimulator } from "./handlers/shippingSimulator";

export const initCronJobs = () => {
  cleanupExpiredOrders();
  cleanupExpiredTokens();
  cleanupStaleCarts();
  cleanupUnverifiedUsers();
  runShippingSimulator();
};
