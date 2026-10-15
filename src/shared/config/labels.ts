/**
 * SANOQLI QIYMATLARNING O'ZBEKCHA YORLIQLARI — YAGONA MANBA.
 *
 * ⚠️ YORLIQ KOMPONENT ICHIDA YOZILMAYDI. Holat nomi o'nlab joyda
 * ko'rinadi (ro'yxat, filtr, karta, hisobot) va har joyda qo'lda
 * yozilsa, ular ajralib ketardi: bir ekranda "Hal qilindi",
 * boshqasida "Yopildi".
 *
 * ⚠️ RANG HAM SHU YERDA: holat rangi ma'noni tashiydi (qizil —
 * e'tibor kerak) va u ham bir xil bo'lishi shart.
 */

import type {
  IssuePriority,
  IssueSource,
  IssueStatus,
  ScopeKind,
  SignalKind,
  SignalSeverity,
  SignalStatus,
  UserRole,
} from "../api/types";

/** Tailwind klasslari — `badge` uchun. */
interface LabelDef {
  label: string;
  className: string;
}

export const SIGNAL_KIND: Record<SignalKind, LabelDef> = {
  complaint: {
    label: "Shikoyat",
    className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  suggestion: {
    label: "Taklif",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  question: {
    label: "Savol",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
};

export const SIGNAL_SEVERITY: Record<SignalSeverity, LabelDef> = {
  low: {
    label: "Past",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  normal: {
    label: "O'rta",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  high: {
    label: "Yuqori",
    className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  },
};

export const SIGNAL_STATUS: Record<SignalStatus, LabelDef> = {
  new: {
    label: "Yangi",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  attached: {
    label: "Muammoga biriktirilgan",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  dismissed: {
    label: "E'tiborsiz qoldirilgan",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

export const ISSUE_STATUS: Record<IssueStatus, LabelDef> = {
  new: {
    label: "Yangi",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  in_progress: {
    label: "Ko'rib chiqilmoqda",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  resolved: {
    label: "Hal qilindi",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  rejected: {
    label: "Rad etildi",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

export const ISSUE_PRIORITY: Record<IssuePriority, LabelDef> = {
  low: {
    label: "Past",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  normal: {
    label: "Oddiy",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  },
  high: {
    label: "Yuqori",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
  urgent: {
    label: "Shoshilinch",
    className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  },
};

/**
 * ⚠️ MANBA YORLIG'I MUHIM: "AI topdi" va "odam yubordi" ni ajratib
 * ko'rsatish AI'ning foydasini baholashning yagona yo'li.
 */
export const ISSUE_SOURCE: Record<IssueSource, LabelDef> = {
  signal: {
    label: "AI signali",
    className: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
  bot: {
    label: "Botdan",
    className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
  manual: {
    label: "Qo'lda",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
};

export const USER_ROLE: Record<UserRole, string> = {
  owner: "Tizim egasi",
  admin: "Ma'muriyat",
  operator: "Operator",
  viewer: "Kuzatuvchi",
};

export const SCOPE_KIND: Record<ScopeKind, string> = {
  province: "Butun viloyat",
  district: "Bitta tuman",
};

/**
 * AUDIT AMALLARI.
 *
 * ⚠️ TO'LIQ EMAS va bo'lishi shart emas: tanilmagan amal KALIT
 * ko'rinishida chiqadi ("signal.attach"). Bu `undefined` dan
 * yaxshi va yangi amal qo'shilganda jurnal darhol ishlaydi.
 */
export const AUDIT_ACTION: Record<string, string> = {
  "auth.login": "Tizimga kirdi",
  "auth.login_failed": "Kirish urinishi muvaffaqiyatsiz",
  "auth.refresh_reuse": "⚠️ Token qayta ishlatildi — sessiyalar yopildi",
  "group.official_on": "Guruhni rasmiy deb belgiladi",
  "group.official_off": "Guruhdan rasmiy belgisini oldi",
  "group.assign_mahalla": "Guruhga MFY biriktirdi",
  "signal.attach": "Signalni muammoga biriktirdi",
  "signal.dismiss": "Signalni e'tiborsiz qoldirdi",
  "issue.create": "Muammo yaratdi",
  "issue.create_bot": "Botdan muammo yubordi",
  "issue.assign": "Ijrochi belgiladi",
  "issue.resolve": "Muammoni hal qildi",
  "issue.reject": "Muammoni rad etdi",
  "issue.reopen": "Muammoni qayta ochdi",
  "issue_category.create": "Kategoriya yaratdi",
  "issue_category.update": "Kategoriyani tahrirladi",
  "issue_category.deactivate": "Kategoriyani o'chirdi",
  "territory.district_create": "Tuman qo'shdi",
  "territory.district_update": "Tumanni tahrirladi",
  "territory.district_archive": "Tumanni arxivladi",
  "territory.mahalla_create": "MFY qo'shdi",
  "territory.mahalla_update": "MFY ni tahrirladi",
  "territory.mahalla_archive": "MFY ni arxivladi",
  "user.create": "Xodim qo'shdi",
  "user.update": "Xodimni tahrirladi",
  "user.archive": "Xodimni arxivladi",
  "user.restore": "Xodimni qaytardi",
  "user.reset_password": "Parolni tikladi",
  "settings.update": "Sozlamalarni o'zgartirdi",
};

/** Sanoq so'zi — "12 ta murojaat". */
export const plural = (count: number, word: string): string => `${count} ta ${word}`;
