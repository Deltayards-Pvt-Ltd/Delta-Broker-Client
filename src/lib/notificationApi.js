import { API_URL, getToken } from "@/lib/auth";

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function fetchNotifications(page = 1, limit = 8) {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await fetch(`${API_URL}/api/notifications?${qs}`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function fetchUnreadCount() {
  const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function markNotificationRead(id) {
  const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: "POST",
    headers: authHeaders(),
  });
  return parse(res);
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${API_URL}/api/notifications/read-all`, {
    method: "POST",
    headers: authHeaders(),
  });
  return parse(res);
}

/** Where to go when clicking a notification */
export function notificationHref(n) {
  if (n?.type === "passwordResetNudge") {
    return n?.meta?.link || "/profile/password";
  }
  if (n?.type === "approvalRequired") return "/approvals";
  if (n?.type === "welcome" || n?.type === "approved") return "/projects";
  if (n?.type === "broadcast") {
    if (n?.meta?.kind === "offer") return null;
    const link = n?.meta?.link;
    if (link) return link;
    return "/dashboard";
  }
  const link = n?.meta?.link;
  if (link) return link;
  return null;
}
