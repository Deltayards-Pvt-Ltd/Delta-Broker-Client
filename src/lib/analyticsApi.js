import { API_URL, getToken, getUser } from "@/lib/auth";
import { isBrokerRole, isStaffRole } from "@/lib/roles";
import { fetchFcSeries, fetchLeadFilterMeta } from "@/lib/leadApi";

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

function analyticsQs(opts = {}) {
  const params = new URLSearchParams();
  const mode = opts.mode || "month";
  params.set("mode", mode);
  if (mode === "year") {
    if (opts.fromYear) params.set("fromYear", String(opts.fromYear));
    if (opts.toYear) params.set("toYear", String(opts.toYear));
  } else if (opts.year) {
    params.set("year", String(opts.year));
  }
  return params.toString();
}

export async function fetchBrokerJoins(opts = {}) {
  const res = await fetch(`${API_URL}/api/analytics/brokers?${analyticsQs(opts)}`, {
    headers: authHeaders(),
  });
  return parse(res);
}

export async function fetchTopPartners(opts = {}) {
  const params = new URLSearchParams();
  if (opts.startDate) params.set("startDate", opts.startDate);
  if (opts.endDate) params.set("endDate", opts.endDate);
  const q = params.toString();
  const res = await fetch(
    `${API_URL}/api/analytics/top-partners${q ? `?${q}` : ""}`,
    { headers: authHeaders() }
  );
  return parse(res);
}

export async function fetchTopFcPartners(opts = {}) {
  const res = await fetch(
    `${API_URL}/api/analytics/top-fc-partners?${analyticsQs(opts)}`,
    { headers: authHeaders() }
  );
  return parse(res);
}

function leadStatusChart(meta) {
  const statuses = [...(meta?.statuses || [])].sort(
    (a, b) => (b.count || 0) - (a.count || 0)
  );
  return {
    id: "leadStatus",
    type: "pie",
    title: "Leads by status",
    name: "Leads",
    empty: "No leads in this range.",
    total: meta?.leadsCount ?? statuses.reduce((n, s) => n + (s.count || 0), 0),
    series: statuses.map((s) => ({
      label: s.name,
      value: s.count || 0,
    })),
  };
}

function staffJoinsChart(data) {
  return {
    id: "joins",
    type: "bar",
    title: "Broker joins",
    name: "Joined",
    empty: "No joins in this range.",
    total: data?.total ?? 0,
    series: data?.series || [],
  };
}

function topPartnersChart(data) {
  return {
    id: "topPartners",
    type: "rank",
    title: "Top channel partners",
    name: "Leads",
    empty: "No partner leads yet.",
    total: data?.total ?? 0,
    series: data?.series || [],
  };
}

const SAMPLE_FC_PARTNERS = [
  { label: "Horizon Realty", value: 12 },
  { label: "Skyline CP", value: 8 },
  { label: "Delta Homes", value: 5 },
  { label: "Prime Brokers", value: 3 },
  { label: "Apex Channel", value: 2 },
];

const SAMPLE_FC_MONTH = [2, 1, 3, 0, 4, 2, 5, 3, 1, 2, 0, 4];

function sampleFcSeries(series) {
  const labels = series.length
    ? series.map((p) => p.label)
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  return labels.map((label, i) => ({
    label,
    value: SAMPLE_FC_MONTH[i % SAMPLE_FC_MONTH.length],
  }));
}

function fcPartnersChart(data) {
  const series = (data?.series || [])
    .filter((p) => (p.value || 0) > 0)
    .slice(0, 5);
  const total = series.reduce((n, p) => n + (p.value || 0), 0);
  if (total) {
    return {
      id: "fcPartners",
      type: "pie",
      title: "Final closures",
      name: "FC",
      empty: "No final closures in this range.",
      total,
      series,
    };
  }
  return {
    id: "fcPartners",
    type: "pie",
    title: "Final closures",
    name: "FC",
    empty: "No final closures in this range.",
    total: SAMPLE_FC_PARTNERS.reduce((n, p) => n + p.value, 0),
    series: SAMPLE_FC_PARTNERS,
  };
}

function fcSeriesChart(data) {
  const series = data?.series || [];
  const total = data?.total ?? series.reduce((n, p) => n + (p.value || 0), 0);
  if (total) {
    return {
      id: "fcSeries",
      type: "area",
      title: "Final closures",
      name: "FC",
      empty: "No final closures in this range.",
      total,
      series,
    };
  }
  const sample = sampleFcSeries(series);
  return {
    id: "fcSeries",
    type: "area",
    title: "Final closures",
    name: "FC",
    empty: "No final closures in this range.",
    total: sample.reduce((n, p) => n + p.value, 0),
    series: sample,
  };
}

export async function fetchAnalytics(opts = {}) {
  const user = getUser();
  if (!user) throw new Error("Not logged in");

  const charts = [];

  if (isStaffRole(user.role)) {
    const [joins, top, fc] = await Promise.all([
      fetchBrokerJoins(opts),
      fetchTopPartners(),
      fetchTopFcPartners(opts),
    ]);
    charts.push(staffJoinsChart(joins));
    charts.push(topPartnersChart(top));
    charts.push(fcPartnersChart(fc));
  }

  if (isBrokerRole(user.role)) {
    const [meta, fc] = await Promise.all([
      fetchLeadFilterMeta({
        startDate: opts.startDate,
        endDate: opts.endDate,
      }),
      fetchFcSeries({
        mode: opts.mode,
        year: opts.year,
        fromYear: opts.fromYear,
        toYear: opts.toYear,
      }),
    ]);
    charts.push(leadStatusChart(meta));
    charts.push(fcSeriesChart(fc));
  }

  return { role: user.role, charts };
}
