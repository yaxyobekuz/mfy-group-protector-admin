/**
 * YO'NALISH BELGILARI — `mobile/src/shared/config/icons.tsx` NING KO'ZGUSI.
 *
 * ⚠️ IKKI REPODA BIR XIL BO'LISHI SHART (CLAUDE.md "Yo'nalish belgisi →
 * mobile/.../icons.tsx VA admin/.../category-icons.ts"). Panelda
 * belgi tanlab qo'yilganda u ilovada ham AYNI ko'rinishi kerak — ICONS
 * kalitlari ajralsa, panel "lamp" ko'rsatib, ilova zahira belgi
 * ko'rsatardi.
 *
 * ⚠️ BAZADA KALIT SAQLANADI (`IssueCategory.icon`), SVG EMAS. Tanilmagan
 * kalit — ZAHIRA belgi (bo'sh joy emas).
 */

import {
  Building2,
  Bus,
  CircleEllipsis,
  Droplets,
  FileText,
  HeartHandshake,
  Lightbulb,
  Route,
  ShieldAlert,
  Trash2,
  TreeDeciduous,
  UserCog,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  water: Droplets,
  road: Route,
  trash: Trash2,
  social: HeartHandshake,
  shield: ShieldAlert,
  staff: UserCog,
  document: FileText,
  more: CircleEllipsis,

  lamp: Lightbulb,
  power: Zap,
  tree: TreeDeciduous,
  building: Building2,
  transport: Bus,
};

const FALLBACK = CircleEllipsis;

export const categoryIcon = (key: string | null | undefined): LucideIcon =>
  (key ? ICONS[key] : undefined) ?? FALLBACK;

export const categoryColor = (color: string | null | undefined): string =>
  color ?? "#2563eb";

/** Panelda belgi tanlash uchun — barcha mavjud kalitlar. */
export const ICON_KEYS = Object.keys(ICONS);
