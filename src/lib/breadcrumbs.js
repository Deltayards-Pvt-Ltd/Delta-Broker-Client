export function breadcrumbsFromPath(pathname) {
  if (!pathname || pathname === "/dashboard") {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  const map = {
    approvals: "Approvals",
    broadcast: "Broadcast",
    updates: "Updates",
    notifications: "Updates",
    brokers: "Brokers",
    admins: "Admins",
    projects: "Projects",
    offers: "Offers",
    profile: "Account",
    password: "Password",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    categories: "Categories",
    active: "Active",
    closed: "Closed",
    new: "Add",
    edit: "Edit",
  };

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", href: "/dashboard" }];
  let acc = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    acc += `/${part}`;
    const next = parts[i + 1];

    // Skip raw Mongo ids in the trail (e.g. /offers/:id/edit → Offers / Edit)
    if (/^[a-f\d]{24}$/i.test(part)) {
      if (next === "edit") continue;
      crumbs.push({ label: "Details", href: acc });
      continue;
    }

    const label = map[part] || decodeURIComponent(part).replace(/-/g, " ");
    crumbs.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href: acc,
    });
  }

  return crumbs;
}
