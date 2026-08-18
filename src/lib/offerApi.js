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

export function offerIdFromFeed(item) {
  return item?.offerId || item?.meta?.offerId || null;
}

export function isOfferFeedItem(item) {
  return (
    item?.kind === "offer" ||
    item?.meta?.kind === "offer" ||
    Boolean(offerIdFromFeed(item))
  );
}

/** Load the Offer doc from an inbox/outbox row. No navigation. */
export async function resolveOfferFromFeed(item) {
  const id = offerIdFromFeed(item);
  if (id) {
    const data = await fetchOffer(id);
    return data.offer || null;
  }
  if (!isOfferFeedItem(item)) return null;
  const title = String(item?.title || "").trim().toLowerCase();
  if (!title) return null;
  const data = await fetchOffers({ page: 1, limit: 50 });
  return (
    (data.offers || []).find(
      (o) => String(o.title || "").trim().toLowerCase() === title
    ) || null
  );
}
