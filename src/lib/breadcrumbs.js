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
    active: "Active",
    closed: "Closed",
    new: "Add",
    edit: "Edit",
  };

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", href: "/dashboard" }];
  let acc = "";

  for (const part of parts) {
    acc += `/${part}`;
    const label = map[part] || decodeURIComponent(part).replace(/-/g, " ");
    crumbs.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href: acc,
    });
  }

  return crumbs;
}
