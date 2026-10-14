import {
  Home,
  Users,
  FolderKanban,
  BadgeCheck,
  LayoutDashboard,
  Bell,
  Gift,
  ContactRound,
  BarChart3,
  Smartphone,
} from "lucide-react";

const ICONS = {
  home: Home,
  users: Users,
  folder: FolderKanban,
  check: BadgeCheck,
  dashboard: LayoutDashboard,
  bell: Bell,
  gift: Gift,
  contact: ContactRound,
  chart: BarChart3,
  phone: Smartphone,
};

export function NavIcon({ name, size = 18 }) {
  const Icon = ICONS[name] || Home;
  return <Icon size={size} strokeWidth={1.75} aria-hidden />;
}
