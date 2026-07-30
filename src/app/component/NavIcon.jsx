import {
  Home,
  Users,
  FolderKanban,
  BadgeCheck,
  LayoutDashboard,
  Bell,
} from "lucide-react";

const ICONS = {
  home: Home,
  users: Users,
  folder: FolderKanban,
  check: BadgeCheck,
  dashboard: LayoutDashboard,
  bell: Bell,
};

export function NavIcon({ name, size = 18 }) {
  const Icon = ICONS[name] || Home;
  return <Icon size={size} strokeWidth={1.75} aria-hidden />;
}
