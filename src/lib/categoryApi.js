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

export async function fetchCategories() {
  const res = await fetch(`${API_URL}/api/broker-categories`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function fetchCategory(id) {
  const res = await fetch(`${API_URL}/api/broker-categories/${id}`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function createCategory(payload) {
  const res = await fetch(`${API_URL}/api/broker-categories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function updateCategory(id, payload) {
  const res = await fetch(`${API_URL}/api/broker-categories/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function deleteCategory(id) {
  const res = await fetch(`${API_URL}/api/broker-categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parse(res);
}

/** @param {string} id @param {{ brokerIds: string[], action: "add"|"remove" }} payload */
export async function updateCategoryMembers(id, payload) {
  const res = await fetch(`${API_URL}/api/broker-categories/${id}/members`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function fetchCategoryRecipientCount(id) {
  const res = await fetch(
    `${API_URL}/api/broker-categories/${id}/recipient-count`,
    { headers: authHeaders() }
  );
  return parse(res);
}
