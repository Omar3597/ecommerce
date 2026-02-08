export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
