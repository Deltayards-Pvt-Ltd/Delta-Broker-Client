import { isStaffRole } from "@/lib/roles";

const TOKEN_KEY = "delta_broker_token";
const USER_KEY = "delta_broker_user";

export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
export const CRM_API_URL = process.env.NEXT_PUBLIC_CRM_API_URL;

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

/** Where to send the user after auth based on role/status */
export function getPostLoginPath(user) {
  if (!user) return "/login";

  if (isStaffRole(user.role)) {
    if (user.passwordResetBySuperAdmin) return "/password-reset";
    return "/dashboard";
  }

  if (user.status === "pending") return "/pending";
  if (user.status === "approved" || user.status === "active") return "/dashboard";
  return "/pending";
}

export function isBrokerPending(user) {
  return user?.role === "broker" && user?.status === "pending";
}

export function isBrokerApproved(user) {
  return (
    user?.role === "broker" &&
    (user?.status === "approved" || user?.status === "active")
  );
}
