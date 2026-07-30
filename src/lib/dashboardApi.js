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

/** Admin-only dashboard counts + recent projects */
export async function fetchDashboardSummary() {
  const res = await fetch(`${API_URL}/api/dashboard/summary`, {
    headers: authHeaders(),
  });
  return parse(res);
}
