import {
  Home,
  Users,
  FolderKanban,
  BadgeCheck,
  LayoutDashboard,
  Bell,
  Gift,
  ContactRound,
<<<<<<< HEAD
  BarChart3,
=======
  ChartColumn,
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
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
<<<<<<< HEAD
  chart: BarChart3,
=======
  chart: ChartColumn,
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
};

export function NavIcon({ name, size = 18 }) {
  const Icon = ICONS[name] || Home;
  return <Icon size={size} strokeWidth={1.75} aria-hidden />;
}
