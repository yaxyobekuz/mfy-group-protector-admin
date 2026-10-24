/**
 * YO'NALISH BELGILARI — PANELDAGI TANLOV RO'YXATI.
 *
 * ⚠️ BU RO'YXAT MOBIL ILOVADAGI `shared/config/icons.tsx` NING
 * KO'ZGUSI. Ikkisi ajralsa, panelda tanlangan belgi ilovada
 * topilmay, zahira belgi chiqardi — va buni hech kim sezmasdi,
 * chunki panel o'z ro'yxatidan to'g'ri qiymat ko'rsatib turardi.
 *
 * ⚠️ KALIT SAQLANADI, SVG EMAS (`IssueCategory.icon`): manzil yoki
 * SVG saqlansa, ilova dizayni o'zgarganda bazadagi yozuvlar
 * eskirardi.
 */

export const CATEGORY_ICONS: { key: string; label: string }[] = [
  { key: "water", label: "Suv / kommunal" },
  { key: "road", label: "Yo'l" },
  { key: "trash", label: "Chiqindi" },
  { key: "social", label: "Ijtimoiy yordam" },
  { key: "shield", label: "Xavfsizlik" },
  { key: "staff", label: "Xodim faoliyati" },
  { key: "document", label: "Hujjat" },
  { key: "lamp", label: "Yoritish" },
  { key: "power", label: "Elektr" },
  { key: "tree", label: "Obodonlashtirish" },
  { key: "building", label: "Bino va inshootlar" },
  { key: "transport", label: "Transport" },
  { key: "more", label: "Boshqa" },
];
