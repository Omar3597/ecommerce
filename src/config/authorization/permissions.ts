import { Role, ROLES } from "./roles";

export type Action = "read" | "create" | "update" | "delete";
export type Resource =
  | "product"
  | "review"
  | "user"
  | "order"
  | "category"
  | "dashboard";

type PermissionMap = {
  [R in Resource]?: {
    [A in Action]?: Role[] | "*";
  };
};

export const permissions: PermissionMap = {
  product: {
    read: [ROLES.ADMIN, ROLES.MANAGER],
    create: [ROLES.ADMIN, ROLES.MANAGER],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN],
  },

  category: {
    read: [ROLES.ADMIN, ROLES.MANAGER],
    create: [ROLES.ADMIN, ROLES.MANAGER],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN],
  },

  user: {
    read: [ROLES.ADMIN, ROLES.MANAGER],
    create: "*",
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },

  order: {
    read: [ROLES.ADMIN, ROLES.MANAGER],
    create: [ROLES.USER, ROLES.ADMIN],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN],
  },

  dashboard: {
    read: [ROLES.ADMIN, ROLES.MANAGER],
    create: "*",
    update: "*",
    delete: "*",
  },
};
