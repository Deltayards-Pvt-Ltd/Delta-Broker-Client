/** Whole days until a date (local calendar). null if missing/invalid. */
function daysUntil(dateVal) {
  if (!dateVal) return null;
  const end = new Date(dateVal);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((endDay - today) / 86400000);
}

export function startingSoonLabel(startsAt) {
  const days = daysUntil(startsAt);
  if (days == null || days <= 0) return null;
  if (days === 1) return "Starting in 1 day";
  if (days < 10) return `Starting in ${days} days`;
  return "Starting soon";
}

export function expiringSoonLabel(endsAt) {
  const days = daysUntil(endsAt);
  if (days == null || days < 0 || days >= 10) return null;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expiring in 1 day";
  return `Expiring in ${days} days`;
}

/** Prefer starting badge over expiring when not live yet. */
export function offerBadge(startsAt, endsAt) {
  const start = startingSoonLabel(startsAt);
  if (start) return { kind: "start", label: start };
  const end = expiringSoonLabel(endsAt);
  if (end) return { kind: "end", label: end };
  return null;
}
