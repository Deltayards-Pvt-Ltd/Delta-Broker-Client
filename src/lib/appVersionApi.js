import { API_URL, getToken } from "@/lib/auth";

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function fetchAppVersion() {
  const res = await fetch(`${API_URL}/api/app-version`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function updateAppVersion(body) {
  const res = await fetch(`${API_URL}/api/app-version`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parse(res);
}
