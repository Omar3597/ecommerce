import { Role, ROLES } from "./roles";

export type Action = "read" | "create" | "update" | "delete";
export type Resource = "product" | "review" | "user" | "order" | "category";

type PermissionMap = {
  [R in Resource]?: {
    [A in Action]?: Role[] | "*";
  };
};

export const permissions: PermissionMap = {
  product: {
    read: "*",
    create: [ROLES.ADMIN, ROLES.MANAGER],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN],
  },

  review: {
    read: "*",
    create: [ROLES.USER, ROLES.ADMIN],
    update: [ROLES.USER, ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },

  user: {
    read: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },

  order: {
    read: [ROLES.USER, ROLES.ADMIN],
    create: [ROLES.USER],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },

  category: {
    read: "*",
    create: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },
};
