import {
  Home,
  Users,
  FolderKanban,
  BadgeCheck,
  LayoutDashboard,
  Bell,
  Gift,
} from "lucide-react";

const ICONS = {
  home: Home,
  users: Users,
  folder: FolderKanban,
  check: BadgeCheck,
  dashboard: LayoutDashboard,
  bell: Bell,
  gift: Gift,
};

export function NavIcon({ name, size = 18 }) {
  const Icon = ICONS[name] || Home;
  return <Icon size={size} strokeWidth={1.75} aria-hidden />;
}
