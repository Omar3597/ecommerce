import { orderExpirationJob } from "./orderExpiration.job";

export const initCronJobs = () => {
  orderExpirationJob();
};