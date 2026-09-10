import { API_URL, getToken } from "@/lib/auth";

function authHeaders() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated — login again");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function leadQs(extra = {}) {
  const qs = new URLSearchParams();
  if (extra.q) qs.set("q", extra.q);
  if (extra.projectId) qs.set("projectId", extra.projectId);
  if (extra.statusId) qs.set("statusId", extra.statusId);
  if (extra.page) qs.set("page", String(extra.page));
  if (extra.limit) qs.set("limit", String(extra.limit));
  if (extra.startDate) qs.set("startDate", extra.startDate);
  if (extra.endDate) qs.set("endDate", extra.endDate);
  if (extra.mode) qs.set("mode", extra.mode);
  if (extra.year) qs.set("year", String(extra.year));
  if (extra.fromYear) qs.set("fromYear", String(extra.fromYear));
  if (extra.toYear) qs.set("toYear", String(extra.toYear));
  return qs.toString();
}

async function apiGet(path) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }

  let res;
  try {
    res = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, {
      headers: authHeaders(),
    });
  } catch (e) {
    throw new Error(
      e?.message?.includes("Network") || e?.message?.includes("Failed to fetch")
        ? "Cannot reach server"
        : e.message || "Network error"
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Failed (${res.status})`);
  }
  return data;
}

export async function fetchLeadCountForChannelPartner() {
  return apiGet("/api/leads/count");
}

/** Same contract as mobile: page/limit default 20. */
export async function fetchLeadsForChannelPartner({
  page = 1,
  limit = 20,
  q,
  projectId,
  statusId,
} = {}) {
  return apiGet(`/api/leads?${leadQs({ page, limit, q, projectId, statusId })}`);
}

export async function fetchLeadById(id) {
  if (!id) throw new Error("Lead id is required");
  return apiGet(`/api/leads/${encodeURIComponent(id)}`);
}

export async function fetchLeadFilterMeta(opts = {}) {
  const qs = new URLSearchParams();
  if (opts.startDate) qs.set("startDate", opts.startDate);
  if (opts.endDate) qs.set("endDate", opts.endDate);
  const q = qs.toString();
  return apiGet(`/api/leads/meta${q ? `?${q}` : ""}`);
}

/** GET /api/leads/fc-series — booking-date FC counts by month/year */
export async function fetchFcSeries(opts = {}) {
  const qs = new URLSearchParams();
  if (opts.mode) qs.set("mode", opts.mode);
  if (opts.year) qs.set("year", String(opts.year));
  if (opts.fromYear) qs.set("fromYear", String(opts.fromYear));
  if (opts.toYear) qs.set("toYear", String(opts.toYear));
  const q = qs.toString();
  return apiGet(`/api/leads/fc-series${q ? `?${q}` : ""}`);
}
