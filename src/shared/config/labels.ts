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
  ThreatAction,
  ThreatKind,
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
    className: "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300",
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
    className: "bg-primary/10 text-primary dark:bg-primary/20",
  },
  dismissed: {
    label: "E'tiborsiz qoldirilgan",
    className: "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400",
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
    className: "bg-primary/10 text-primary dark:bg-primary/20",
  },
  rejected: {
    label: "Rad etildi",
    className: "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

export const ISSUE_PRIORITY: Record<IssuePriority, LabelDef> = {
  low: {
    label: "Past",
    className: "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300",
  },
  normal: {
    label: "Oddiy",
    className: "bg-stone-100 text-stone-700 dark:bg-zinc-800 dark:text-zinc-200",
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
    className: "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300",
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
  "group.guard_on": "Xavfsizlik qalqonini yoqdi",
  "group.guard_off": "Xavfsizlik qalqonini o'chirdi",
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

// ═══════════════════════════════════════════════════════════════════
//  XAVFSIZLIK
// ═══════════════════════════════════════════════════════════════════

/**
 * ⚠️ TUR MA'NO TASHIYDI va rang shunga qarab beriladi: apk — qasddan
 * tarqatilgan dastur (qizil), qisqartirilgan havola esa ko'pincha
 * oddiy e'lon (sariq). Ikkisini bitta rangga bo'yash ma'muriyatga
 * "nima jiddiyroq" degan savolda yordam bermasdi.
 */
export const THREAT_KIND: Record<ThreatKind, LabelDef> = {
  apk_file: {
    label: "O'rnatma fayl",
    className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  },
  unknown_file: {
    label: "Noma'lum fayl",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
  suspicious_url: {
    label: "Shubhali havola",
    className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  shortened_url: {
    label: "Qisqartirilgan havola",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  masked_url: {
    label: "Yashirilgan manzil",
    className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  },
  scam_text: {
    label: "Firibgarlik matni",
    className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  },
};

/**
 * ⚠️ "O'CHIRILDI" VA "O'CHIRILMADI" ANIQ AJRATILGAN: bot admin
 * bo'lmasa o'chira olmaydi va bu holat ko'rinmasa, ma'muriyat
 * "himoya ishlayapti" deb o'ylab yuraverardi.
 */
export const THREAT_ACTION: Record<ThreatAction, LabelDef> = {
  deleted: {
    label: "O'chirildi",
    className: "bg-primary/10 text-primary dark:bg-primary/20",
  },
  detected: {
    label: "O'chirilmadi",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  delete_failed: {
    label: "Xato — o'chmadi",
    className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  },
};

/**
 * QOIDA KALITINI O'ZBEKCHAGA AYLANTIRADI.
 *
 * ⚠️ KALIT `turi:qiymat` SHAKLIDA (`installer_extension:apk`) —
 * qiymat o'zgaruvchan, shuning uchun prefiks bo'yicha mos keladi.
 * Tanilmagan kalit KALIT ko'rinishida chiqadi (audit bilan ayni
 * yondashuv): bu `undefined` dan yaxshi va yangi qoida qo'shilganda
 * panel darhol ishlayveradi.
 */
export const threatReason = (reason: string): string => {
  const [key, value] = reason.split(":");

  switch (key) {
    case "installer_extension":
      return `O'rnatma fayl kengaytmasi (.${value})`;
    case "installer_mime":
      return "O'rnatma fayl turi";
    case "archive_extension":
      return `Arxiv — ichidagi noma'lum (.${value})`;
    case "double_extension":
      return `Ikki kengaytmali nom (.${value} yashirilgan)`;
    case "blocked_host":
      return "Qora ro'yxatdagi domen";
    case "url_shortener":
      return "Qisqartirgich — manzil ko'rinmaydi";
    case "userinfo_in_url":
      return "Havolada @ belgisi — manzil yashirilgan";
    case "raw_ip_host":
      return "Domen o'rniga IP manzil";
    case "domain_mismatch":
      return `Ko'rinishda ${value}, amalda boshqa sayt`;
    case "scam_phrase":
      return `Firibgarlik iborasi ("${value}") + ishonchsiz havola`;
    case "scam_phrase_money":
      return `Firibgarlik iborasi ("${value}") + katta summa`;
    case "scam_phrase_urgency":
      return `Firibgarlik iborasi ("${value}") + shoshiltirish`;
    default:
      return reason;
  }
};
