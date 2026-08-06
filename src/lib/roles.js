export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  BROKER: "broker",
};

export const STAFF_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function isSuperAdminRole(role) {
  return role === ROLES.SUPER_ADMIN;
}

export function isPlainAdminRole(role) {
  return role === ROLES.ADMIN;
}

export function isBrokerRole(role) {
  return role === ROLES.BROKER;
}

export function staffLabel(role) {
  if (role === ROLES.SUPER_ADMIN) return "Super Admin";
  if (role === ROLES.ADMIN) return "Admin";
  if (role === ROLES.BROKER) return "Channel Partner";
  return role || "—";
}
