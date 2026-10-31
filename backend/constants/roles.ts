export const ROLES = {
  ADMIN: 'ADMIN',
  SHOP_OWNER: 'SHOP_OWNER',
  SHOP_CASHIER: 'SHOP_CASHIER',
} as const;

export const ADMIN = ROLES.ADMIN;
export const SHOP_OWNER = ROLES.SHOP_OWNER;
export const SHOP_CASHIER = ROLES.SHOP_CASHIER;

export const ALL_ROLES = [ROLES.ADMIN, ROLES.SHOP_OWNER, ROLES.SHOP_CASHIER] as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export function isValidRole(role: any): role is UserRole {
  return role === ROLES.ADMIN || role === ROLES.SHOP_OWNER || role === ROLES.SHOP_CASHIER;
}
