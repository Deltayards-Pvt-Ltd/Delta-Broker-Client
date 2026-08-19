export function pickCustom(cd, keys) {
  for (const k of keys) {
    const v = cd?.[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

export function leadName(lead) {
  const cd = lead?.customData || {};
  const first = pickCustom(cd, ["First Name", "firstName", "Name", "name"]);
  const last = pickCustom(cd, ["Last Name", "lastName"]);
  return `${first} ${last}`.trim() || "Lead";
}

export function leadPhone(lead) {
  return pickCustom(lead?.customData, [
    "Phone",
    "phone",
    "contact",
    "Mobile",
    "mobile",
  ]);
}

export function leadEmail(lead) {
  return pickCustom(lead?.customData, ["Email", "email"]);
}

export function leadProject(lead) {
  return lead?.project?.name || "";
}

export function leadStatus(lead) {
  return lead?.currentStatus?.name || "";
}

export function formatLeadDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatOnDate(value) {
  const date = formatLeadDate(value);
  if (!date) return "";
  const d = new Date(value);
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return time ? `On ${date}, ${time}` : `On ${date}`;
}

export function formatLeadDateTime(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const date = formatLeadDate(d);
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  return hasTime ? `${date}, ${time}` : date;
}

function parseMaybeDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  const t = String(raw).trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

function valueByField(data, matcher) {
  if (!data || typeof data !== "object") return null;
  for (const [key, value] of Object.entries(data)) {
    if (matcher(String(key).trim().toLowerCase())) {
      const at = parseMaybeDate(value);
      if (at) return at;
    }
  }
  return null;
}

export function pickSchedule(data) {
  const bookingAt = valueByField(
    data,
    (n) => n === "booking date" || n.endsWith("booking date")
  );
  const visitAt = valueByField(
    data,
    (n) =>
      n === "visit date time" ||
      n.endsWith("visit date time") ||
      n === "meeting date time" ||
      (n.endsWith("meeting date time") && !n.includes("next"))
  );
  const followupAt = valueByField(
    data,
    (n) =>
      n.includes("next meeting date time") ||
      n === "next call" ||
      n.includes("follow-up date") ||
      n.includes("follow up date")
  );

  if (bookingAt) {
    return {
      kind: "booking",
      sentence: `Booked on ${formatLeadDate(bookingAt)}`,
    };
  }
  if (visitAt) {
    return {
      kind: "visit",
      sentence: `Last visit on ${formatLeadDateTime(visitAt)}`,
    };
  }
  if (followupAt) {
    return {
      kind: "followup",
      sentence: `Next follow-up on ${formatLeadDateTime(followupAt)}`,
    };
  }
  return { kind: "", sentence: "" };
}

const STATUS_TONES = [
  { test: /new|fresh|open/i, bg: "#2563EB", text: "#FFFFFF" },
  { test: /contact/i, bg: "#0891B2", text: "#FFFFFF" },
  { test: /not\s*interest|junk|lost|dead|unqualif|invalid/i, bg: "#DC2626", text: "#FFFFFF" },
  { test: /site\s*visit\s*schedul/i, bg: "#D97706", text: "#FFFFFF" },
  { test: /site\s*visit/i, bg: "#0D9488", text: "#FFFFFF" },
  { test: /interest/i, bg: "#059669", text: "#FFFFFF" },
  { test: /book|token|win|sold/i, bg: "#16A34A", text: "#FFFFFF" },
  { test: /call\s*back|follow/i, bg: "#7C3AED", text: "#FFFFFF" },
  { test: /negotiat/i, bg: "#EA580C", text: "#FFFFFF" },
];

const HASH_TONES = [
  { bg: "#2563EB", text: "#FFFFFF" },
  { bg: "#7C3AED", text: "#FFFFFF" },
  { bg: "#DB2777", text: "#FFFFFF" },
  { bg: "#D97706", text: "#FFFFFF" },
  { bg: "#059669", text: "#FFFFFF" },
  { bg: "#0891B2", text: "#FFFFFF" },
];

function hashTone(name) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return HASH_TONES[h % HASH_TONES.length];
}

export function statusBadgeColors(status) {
  const name = status?.name || (typeof status === "string" ? status : "");
  const raw = status?.color;
  if (typeof raw === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw.trim())) {
    return { bg: raw.trim(), text: "#FFFFFF" };
  }
  const hit = STATUS_TONES.find((t) => t.test.test(name));
  if (hit) return { bg: hit.bg, text: hit.text };
  return name ? hashTone(name) : { bg: "#6B7280", text: "#FFFFFF" };
}

function activityEvent({ id, at, statusName, data }) {
  const name = statusName || "";
  const schedule = pickSchedule(data);
  return {
    id,
    at,
    statusName: name,
    kind: schedule.kind,
    sentence: schedule.sentence,
  };
}

/** Newest first. Status badge + optional date sentence. No CRM remarks. */
export function leadActivities(lead) {
  const changes = Array.isArray(lead?.statusChanges) ? lead.statusChanges : [];
  const events = [];

  if (changes.length) {
    const initialName = changes[0]?.oldStatusName || leadStatus(lead);
    if (lead?.createdAt && initialName) {
      events.push(
        activityEvent({
          id: "opened",
          at: lead.createdAt,
          statusName: initialName,
          data: {},
        })
      );
    }
    changes.forEach((ch, i) => {
      events.push(
        activityEvent({
          id: `ch-${i}`,
          at: ch.timestamp,
          statusName: ch.newStatusName,
          data: ch.newData,
        })
      );
    });
    return events.reverse();
  }

  const currentName = leadStatus(lead);
  const currentStatus = lead?.currentStatus;
  const hist = Array.isArray(lead?.statusHistory) ? lead.statusHistory : [];
  const createdAt = lead?.createdAt;

  if (createdAt && (hist[0]?.status?.name || currentName)) {
    events.push(
      activityEvent({
        id: "opened",
        at: createdAt,
        statusName: hist[0]?.status?.name || currentName,
        data: hist.length ? {} : lead?.customData,
      })
    );
  }

  hist.forEach((h, i) => {
    const isLast = i === hist.length - 1;
    const nextStatus = isLast ? currentStatus : hist[i + 1]?.status;
    const nextName = nextStatus?.name || (isLast ? currentName : "");
    if (!nextName) return;
    events.push(
      activityEvent({
        id: String(h._id || `h-${i}`),
        at: h.changedAt,
        statusName: nextName,
        data: isLast ? lead?.customData : hist[i + 1]?.data,
      })
    );
  });

  return events.reverse();
}

export function extraFieldIcon(label) {
  const k = String(label || "").toLowerCase();
  if (/gender/i.test(k)) return "gender";
  if (/otp|verified/i.test(k)) return "verified";
  if (/budget|price|cost|amount|value/.test(k)) return "budget";
  if (/propert/.test(k)) return "property";
  if (/config|bhk|layout|unit|flat/.test(k)) return "config";
  if (/prior/.test(k)) return "priority";
  if (/fund|loan/.test(k)) return "fund";
  if (/source/.test(k)) return "source";
  if (/remark|note|comment/.test(k)) return "note";
  if (/location|city|area|locality/.test(k)) return "location";
  return "tag";
}

const SKIP_CUSTOM = new Set([
  "first name",
  "lastname",
  "last name",
  "firstname",
  "name",
  "phone",
  "mobile",
  "contact",
  "channel partner",
]);

const SKIP_CUSTOM_RE =
  /remarks?$|optional remark|comments?$|notes?$|meeting date time|visit date|summary of the conversation|summary of conversation|conversation summary|call summary/i;

export function leadExtraFields(lead) {
  const cd = lead?.customData;
  if (!cd || typeof cd !== "object") return [];
  const rows = [];
  for (const [key, value] of Object.entries(cd)) {
    const k = String(key).trim().toLowerCase();
    if (SKIP_CUSTOM.has(k) || SKIP_CUSTOM_RE.test(k)) continue;
    if (value == null || typeof value === "object") continue;
    const text = String(value).trim();
    if (!text) continue;
    rows.push({ label: key, value: text });
  }
  return rows;
}
