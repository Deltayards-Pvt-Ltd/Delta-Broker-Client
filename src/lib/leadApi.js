import { CRM_API_URL, getUser } from "@/lib/auth";
import { isBrokerRole } from "@/lib/roles";

function crmBase() {
  if (!CRM_API_URL) {
    throw new Error("NEXT_PUBLIC_CRM_API_URL is not set");
  }
  return CRM_API_URL.replace(/\/$/, "");
}

function brokerIdentity() {
  const user = getUser();
  if (!user) throw new Error("Not logged in");
  if (!isBrokerRole(user.role)) {
    throw new Error("Only channel partners can view leads");
  }

  const phone = String(user.phone || "").replace(/\D/g, "").slice(-10);
  const dcpId = String(user.membershipId || user.dcpId || "")
    .trim()
    .toUpperCase();

  if (!phone || phone.length !== 10) {
    throw new Error("Phone number missing on this account");
  }
  if (!dcpId) {
    throw new Error("DCP ID missing on this account");
  }

  return { phone, dcpId };
}

function leadQs(extra = {}) {
  const { phone, dcpId } = brokerIdentity();
  const qs = new URLSearchParams({ mobileNumber: phone, dcpId });
  if (extra.q) qs.set("q", extra.q);
  if (extra.projectId) qs.set("projectId", extra.projectId);
  if (extra.statusId) qs.set("statusId", extra.statusId);
  if (extra.page) qs.set("page", String(extra.page));
  if (extra.limit) qs.set("limit", String(extra.limit));
  return qs.toString();
}

async function crmGet(path) {
  let res;
  try {
    res = await fetch(`${crmBase()}${path}`);
  } catch (e) {
    throw new Error(
      e?.message?.includes("Network") || e?.message?.includes("Failed to fetch")
        ? `Cannot reach CRM at ${crmBase()}`
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
  return crmGet(`/api/dcp/leads/count?${leadQs()}`);
}

/** Same contract as mobile: page/limit default 20. */
export async function fetchLeadsForChannelPartner({
  page = 1,
  limit = 20,
  q,
  projectId,
  statusId,
} = {}) {
  return crmGet(`/api/dcp/leads?${leadQs({ page, limit, q, projectId, statusId })}`);
}

export async function fetchLeadById(id) {
  if (!id) throw new Error("Lead id is required");
  return crmGet(`/api/dcp/leads/${encodeURIComponent(id)}?${leadQs()}`);
}

export async function fetchLeadFilterMeta() {
  return crmGet(`/api/dcp/leads/meta?${leadQs()}`);
}
