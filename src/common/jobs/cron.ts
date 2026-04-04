import { cleanupExpiredOrders } from "./handlers/cleanupOrders";
import { cleanupExpiredTokens } from "./handlers/cleanupTokens";
import { cleanupStaleCarts } from "./handlers/cleanupCarts";
import { cleanupUnverifiedUsers } from "./handlers/cleanupUsers";

export const initCronJobs = () => {
  cleanupExpiredOrders();
  cleanupExpiredTokens();
  cleanupStaleCarts();
  cleanupUnverifiedUsers();
};
