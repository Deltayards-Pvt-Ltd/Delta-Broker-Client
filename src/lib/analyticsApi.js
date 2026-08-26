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

/**
 * @param {{ mode: "year"|"month"|"quarter", year?: number, fromYear?: number, toYear?: number }} opts
 */
export async function fetchBrokerAnalytics(opts) {
  const params = new URLSearchParams();
  params.set("mode", opts.mode);
  if (opts.mode === "year") {
    if (opts.fromYear) params.set("fromYear", String(opts.fromYear));
    if (opts.toYear) params.set("toYear", String(opts.toYear));
  } else if (opts.year) {
    params.set("year", String(opts.year));
  }
  const res = await fetch(`${API_URL}/api/analytics/brokers?${params}`, {
    headers: authHeaders(),
  });
  return parse(res);
}
