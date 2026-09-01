/** Names for an offer's project coverage. Empty = global. */
export function offerProjectNames(offer) {
  const seen = new Set();
  const names = [];
  const raw = [
    ...(Array.isArray(offer?.projects) ? offer.projects : []),
    offer?.project,
  ].filter(Boolean);
  for (const p of raw) {
    const id = String(p?._id || p);
    const name = String(p?.name || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    names.push(name || "Project");
  }
  return names;
}

export function offerChipLabel(offer) {
  const n = offerProjectNames(offer).length;
  if (!n) return "Global";
  return n === 1 ? "1 project" : `${n} projects`;
}

export function offerCoverageLine(offer) {
  return offerChipLabel(offer);
}
