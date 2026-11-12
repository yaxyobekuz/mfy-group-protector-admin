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
  Map as MapIcon,
  MapPin,
  MessageSquareWarning,
  Megaphone,
  Send,
  UserCog,
  Radio,
  ScrollText,
  Settings,
  ShieldAlert,
  Trophy,
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
    href: "/rating",
    label: "Reyting",
    icon: Trophy,
    permission: "citizens.view",
  },
  /**
   * ⚠️ "IJROCHILAR" MUROJAATLAR YONIDA, "ADMINLAR" YONIDA EMAS:
   * bu sahifa XODIM boshqarish emas, murojaat TAQSIMOTI haqida.
   * Adminlar bo'limiga qo'yilsa, operator uni "menga tegishli emas"
   * deb o'tkazib yuborardi.
   */
  {
    href: "/assignees",
    label: "Ijrochilar",
    icon: UserCog,
    permission: "issues.assign",
  },
  {
    href: "/announcements",
    label: "Yangiliklar",
    icon: Megaphone,
    permission: "announcements.manage",
  },
  /**
   * ⚠️ TARQATMA — ALOHIDA SAHIFA, "Fuqarolar" ichidagi oyna EMAS.
   * Sabab: u endi guruhlarga ham boradi va tarixi bor (kim, qachon,
   * kimga nima yuborgan). Oynada tarix ko'rsatib bo'lmasdi.
   */
  {
    href: "/broadcasts",
    label: "Tarqatma",
    icon: Send,
    permission: "broadcast.send",
  },
  { href: "/territory", label: "Hudud", icon: MapPin, permission: "territory.view" },
  { href: "/map", label: "Xarita", icon: MapIcon, permission: "reports.view" },
  { href: "/reports", label: "Hisobotlar", icon: FileText, permission: "reports.view" },
  { href: "/users", label: "Adminlar", icon: Users, permission: "users.view" },
  { href: "/audit", label: "Audit jurnali", icon: ScrollText, permission: "audit.view" },
  { href: "/settings", label: "Sozlamalar", icon: Settings, permission: "settings.manage" },
];
