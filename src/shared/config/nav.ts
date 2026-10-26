/**
 * NAVIGATSIYA — sahifalar va ularga kerakli ruxsat.
 *
 * ⚠️ RUXSAT SHU YERDA E'LON QILINADI va `AppSidebar` menyuni shunga
 * qarab filtrlaydi. Lekin bu FAQAT KO'RINISH: haqiqiy himoya
 * serverda (`@RequirePermissions`). Menyuni yashirish — qulaylik,
 * xavfsizlik emas: foydalanuvchi URL'ni qo'lda yozsa ham server uni
 * to'xtatadi.
 */

import type { LucideIcon } from "lucide-react";
import {
  FileText,
  LayoutDashboard,
  MapPin,
  MessageSquareWarning,
  Megaphone,
  Radio,
  ScrollText,
  Settings,
  ShieldAlert,
  UserCircle,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Ko'rinishi uchun kerakli ruxsat (`undefined` — hammaga). */
  permission?: string;
  /** Yonidagi raqam qaysi sanoqdan olinadi. */
  badge?: "signals" | "issues";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Boshqaruv paneli", icon: LayoutDashboard },
  {
    href: "/signals",
    label: "Signallar",
    icon: Radio,
    permission: "signals.view",
    badge: "signals",
  },
  {
    href: "/issues",
    label: "Murojaatlar",
    icon: MessageSquareWarning,
    permission: "issues.view",
    badge: "issues",
  },
  { href: "/groups", label: "Telegram guruhlari", icon: Radio, permission: "groups.view" },
  {
    href: "/security",
    label: "Xavfsizlik",
    icon: ShieldAlert,
    permission: "security.view",
  },
  {
    href: "/citizens",
    label: "Fuqarolar",
    icon: UserCircle,
    permission: "citizens.view",
  },
  {
    href: "/announcements",
    label: "Yangiliklar",
    icon: Megaphone,
    permission: "announcements.manage",
  },
  { href: "/territory", label: "Hudud", icon: MapPin, permission: "territory.view" },
  { href: "/reports", label: "Hisobotlar", icon: FileText, permission: "reports.view" },
  { href: "/users", label: "Xodimlar", icon: Users, permission: "users.view" },
  { href: "/audit", label: "Audit jurnali", icon: ScrollText, permission: "audit.view" },
  { href: "/settings", label: "Sozlamalar", icon: Settings, permission: "settings.manage" },
];
