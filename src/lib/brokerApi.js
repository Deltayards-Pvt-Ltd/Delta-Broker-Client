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

export async function fetchPendingBrokers() {
  const res = await fetch(`${API_URL}/api/brokers/pending`, {
    headers: authHeaders(),
  });
  return parse(res);
}

/** @param {{ status?: string, page?: number, limit?: number, q?: string }} [opts] */
export async function fetchBrokers(opts = {}) {
  const params = new URLSearchParams();
  if (typeof opts === "string") {
    // legacy: fetchBrokers(status)
    if (opts) params.set("status", opts);
  } else {
    if (opts.status) params.set("status", opts.status);
    if (opts.page) params.set("page", String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.q) params.set("q", opts.q);
  }
  const q = params.toString();
  const res = await fetch(`${API_URL}/api/brokers${q ? `?${q}` : ""}`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function approveBroker(id) {
  const res = await fetch(`${API_URL}/api/brokers/${id}/approve`, {
    method: "POST",
    headers: authHeaders(),
  });
  return parse(res);
}

export async function rejectBroker(id) {
  const res = await fetch(`${API_URL}/api/brokers/${id}/reject`, {
    method: "POST",
    headers: authHeaders(),
  });
  return parse(res);
}

export async function updateBroker(id, payload) {
  const res = await fetch(`${API_URL}/api/brokers/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}
 