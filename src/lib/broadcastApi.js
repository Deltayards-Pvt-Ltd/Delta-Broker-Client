import { API_URL, getToken } from "@/lib/auth";

export const BROADCAST_KINDS = [
  { key: "general", label: "General" },
  { key: "cp_meet", label: "CP Meet" },
  { key: "project", label: "New project" },
  { key: "policy", label: "Policy" },
];

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

export async function fetchBroadcasts(page = 1, limit = 10) {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await fetch(`${API_URL}/api/broadcasts?${qs}`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function sendBroadcast(payload) {
  const res = await fetch(`${API_URL}/api/broadcasts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function deleteBroadcast(id) {
  const res = await fetch(`${API_URL}/api/broadcasts/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parse(res);
}
