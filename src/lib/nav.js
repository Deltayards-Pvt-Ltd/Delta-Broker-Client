import {
  ROLES,
  STAFF_ROLES,
  isStaffRole,
  isSuperAdminRole,
} from "@/lib/roles";

export { ROLES, STAFF_ROLES, isStaffRole, isSuperAdminRole };

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
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    id: "broadcast",
    label: "Broadcast",
    href: "/broadcast",
    icon: "bell",
    roles: STAFF_ROLES,
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
    roles: STAFF_ROLES,
    children: [
      { id: "brokers-all", label: "All Brokers", href: "/brokers" },
      { id: "brokers-approved", label: "Approved", href: "/brokers/approved" },
      { id: "brokers-pending", label: "Pending", href: "/brokers/pending" },
      { id: "brokers-rejected", label: "Rejected", href: "/brokers/rejected" },
      {
        id: "brokers-categories",
        label: "Categories",
        href: "/brokers/categories",
        roles: [ROLES.SUPER_ADMIN],
      },
    ],
  },
  {
    id: "admins",
    label: "Admins",
    href: "/admins",
    icon: "users",
    roles: [ROLES.SUPER_ADMIN],
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
        roles: STAFF_ROLES,
      },
      {
        id: "projects-active",
        label: "Active",
        href: "/projects/active",
        roles: STAFF_ROLES,
      },
      {
        id: "projects-closed",
        label: "Closed",
        href: "/projects/closed",
        roles: STAFF_ROLES,
      },
      {
        id: "projects-new",
        label: "Add Project",
        href: "/projects/new",
        roles: [ROLES.SUPER_ADMIN],
      },
    ],
  },
  {
    id: "offers",
    label: "Offers",
    icon: "folder",
    href: "/offers",
    roles: STAFF_ROLES,
    children: [
      {
        id: "offers-all",
        label: "All Offers",
        href: "/offers",
        roles: STAFF_ROLES,
      },
      {
        id: "offers-new",
        label: "Add Offer",
        href: "/offers/new",
        roles: [ROLES.SUPER_ADMIN],
      },
    ],
  },
  {
    id: "profile",
    label: "Account",
    href: "/profile",
    icon: "users",
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
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    id: "broadcast",
    label: "Broadcast",
    href: "/broadcast",
    roles: STAFF_ROLES,
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
    roles: STAFF_ROLES,
  },
  {
    id: "admins",
    label: "Admins",
    href: "/admins",
    roles: [ROLES.SUPER_ADMIN],
  },
  { id: "projects", label: "Projects", href: "/projects" },
  {
    id: "offers",
    label: "Offers",
    href: "/offers",
    roles: STAFF_ROLES,
  },
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

/** Path access by role */
export function canAccessPath(pathname, role) {
  if (isSuperAdminRole(role)) return true;

  // Plain admin — read-heavy ops; no approvals / admins / project writes
  if (role === ROLES.ADMIN) {
    if (pathname === "/approvals" || pathname.startsWith("/approvals/")) {
      return false;
    }
    if (pathname === "/admins" || pathname.startsWith("/admins/")) {
      return false;
    }
    if (
      pathname === "/projects/new" ||
      pathname.endsWith("/edit")
    ) {
      return false;
    }
    if (
      pathname === "/offers/new" ||
      (pathname.startsWith("/offers/") && pathname.endsWith("/edit"))
    ) {
      return false;
    }
    if (
      pathname === "/dashboard" ||
      pathname === "/profile" ||
      pathname === "/profile/password" ||
      pathname === "/password-reset" ||
      pathname === "/password-reset/change" ||
      pathname === "/broadcast" ||
      pathname.startsWith("/brokers") ||
      pathname === "/projects" ||
      pathname === "/projects/active" ||
      pathname === "/projects/closed" ||
      pathname.startsWith("/projects/") ||
      pathname === "/offers" ||
      pathname.startsWith("/offers/")
    ) {
      // Categories manage is super_admin only
      if (pathname.startsWith("/brokers/categories")) return false;
      return true;
    }
    return false;
  }

  // Broker
  if (pathname === "/dashboard") return true;
  if (pathname === "/profile") return true;
  if (pathname === "/updates") return true;
  if (pathname === "/projects") return true;
  if (pathname === "/offers" || pathname.startsWith("/offers/")) return true;

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
