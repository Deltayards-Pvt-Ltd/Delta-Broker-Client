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

export async function fetchAdmins() {
  const res = await fetch(`${API_URL}/api/admins`, { headers: authHeaders() });
  return parse(res);
}

export async function createAdmin(body) {
  const res = await fetch(`${API_URL}/api/admins`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parse(res);
}

export async function updateAdmin(id, body) {
  const res = await fetch(`${API_URL}/api/admins/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parse(res);
}

export async function resetAdminPassword(id, password) {
  const res = await fetch(`${API_URL}/api/admins/${id}/reset-password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ password }),
  });
  return parse(res);
}

export async function deleteAdmin(id) {
  const res = await fetch(`${API_URL}/api/admins/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parse(res);
}
