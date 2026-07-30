export const ROLES = {
  ADMIN: "admin",
  BROKER: "broker",
};

/** Nav items with role access. Omit `roles` = all authenticated users. */
export const NAV_ITEMS = [
  {
    id: "home",
    label: "Dashboard",
    href: "/dashboard",
    icon: "home",
  },
  {
    id: "approvals",
    label: "Approvals",
    href: "/approvals",
    icon: "check",
    roles: [ROLES.ADMIN],
  },
  {
    id: "broadcast",
    label: "Broadcast",
    href: "/broadcast",
    icon: "bell",
    roles: [ROLES.ADMIN],
  },
  {
    id: "updates",
    label: "Updates",
    href: "/updates",
    icon: "bell",
    roles: [ROLES.BROKER],
  },
  {
    id: "brokers",
    label: "Brokers",
    icon: "users",
    roles: [ROLES.ADMIN],
    children: [
      { id: "brokers-all", label: "All Brokers", href: "/brokers" },
      { id: "brokers-approved", label: "Approved", href: "/brokers/approved" },
      { id: "brokers-pending", label: "Pending", href: "/brokers/pending" },
      { id: "brokers-rejected", label: "Rejected", href: "/brokers/rejected" },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: "folder",
    href: "/projects",
    children: [
      {
        id: "projects-all",
        label: "All Projects",
        href: "/projects",
        roles: [ROLES.ADMIN],
      },
      {
        id: "projects-active",
        label: "Active",
        href: "/projects/active",
        roles: [ROLES.ADMIN],
      },
      {
        id: "projects-closed",
        label: "Closed",
        href: "/projects/closed",
        roles: [ROLES.ADMIN],
      },
      {
        id: "projects-new",
        label: "Add Project",
        href: "/projects/new",
        roles: [ROLES.ADMIN],
      },
    ],
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: "users",
    roles: [ROLES.BROKER],
  },
];

export const TOP_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
  },
  {
    id: "approvals",
    label: "Approvals",
    href: "/approvals",
    roles: [ROLES.ADMIN],
  },
  {
    id: "broadcast",
    label: "Broadcast",
    href: "/broadcast",
    roles: [ROLES.ADMIN],
  },
  {
    id: "updates",
    label: "Updates",
    href: "/updates",
    roles: [ROLES.BROKER],
  },
  {
    id: "brokers",
    label: "Brokers",
    href: "/brokers",
    roles: [ROLES.ADMIN],
  },
  { id: "projects", label: "Projects", href: "/projects" },
];

export function navForRole(items, role) {
  return items
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => {
      if (!item.children?.length) return item;

      const children = item.children.filter(
        (child) => !child.roles || child.roles.includes(role)
      );

      // Broker: Projects is a flat link (no Active/Closed submenu)
      if (!children.length) {
        const { children: _drop, ...rest } = item;
        return rest;
      }

      return { ...item, children };
    });
}

/** Paths brokers may open */
export function canAccessPath(pathname, role) {
  if (role === ROLES.ADMIN) return true;

  if (pathname === "/dashboard") return true;
  if (pathname === "/profile") return true;
  if (pathname === "/updates") return true;
  if (pathname === "/projects") return true;

  if (
    pathname === "/projects/new" ||
    pathname === "/projects/active" ||
    pathname === "/projects/closed" ||
    pathname.endsWith("/edit")
  ) {
    return false;
  }

  if (pathname.startsWith("/projects/")) {
    return true;
  }

  return false;
}
