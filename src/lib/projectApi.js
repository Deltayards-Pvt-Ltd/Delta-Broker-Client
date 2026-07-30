import { API_URL, getToken } from "@/lib/auth";

export const PROJECT_STATUSES = [
  "Under Construction",
  "Ready to Move",
  "Upcoming",
];

export const PROPERTY_TYPES = [
  { value: "", label: "— Select property type —" },
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  {
    value: "Residential & Commercial",
    label: "Residential & Commercial",
  },
];

export const PLAN_OPTIONS = [
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "3.5 BHK",
  "4 BHK",
  "5 BHK",
  "JODI",
];

export const MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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

/** @param {{ page?: number, limit?: number, filter?: string, q?: string }} [opts] */
export async function fetchProjects(opts = {}) {
  const params = new URLSearchParams();
  if (opts.page != null) params.set("page", String(opts.page));
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.filter) params.set("filter", opts.filter);
  if (opts.q) params.set("q", opts.q);
  const q = params.toString();
  const res = await fetch(`${API_URL}/api/projects${q ? `?${q}` : ""}`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function fetchProject(idOrSlug) {
  const res = await fetch(
    `${API_URL}/api/projects/${encodeURIComponent(idOrSlug)}`,
    { headers: authHeaders() }
  );
  return parse(res);
}

export async function createProject(payload) {
  const res = await fetch(`${API_URL}/api/projects`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parse(res);
}

export async function updateProject(id, payload) {
  const res = await fetch(
    `${API_URL}/api/projects/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return parse(res);
}

export async function deleteProject(id) {
  const res = await fetch(
    `${API_URL}/api/projects/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );
  return parse(res);
}
