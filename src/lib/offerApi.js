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

export async function fetchOffers(opts = {}) {
  const qs = new URLSearchParams();
  if (opts.page) qs.set("page", String(opts.page));
  if (opts.limit) qs.set("limit", String(opts.limit));
  if (opts.projectId) qs.set("projectId", opts.projectId);
  if (opts.scope) qs.set("scope", opts.scope);
  if (opts.filter) qs.set("filter", opts.filter);
  const res = await fetch(`${API_URL}/api/offers?${qs}`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function fetchOffer(id) {
  const res = await fetch(`${API_URL}/api/offers/${id}`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function createOffer(payload) {
  const res = await fetch(`${API_URL}/api/offers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function updateOffer(id, payload) {
  const res = await fetch(`${API_URL}/api/offers/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function deleteOffer(id) {
  const res = await fetch(`${API_URL}/api/offers/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parse(res);
}
