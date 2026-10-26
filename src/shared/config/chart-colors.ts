/**
 * DIAGRAMMA RANGLARI — YAGONA MANBA.
 *
 * ⚠️ `labels.ts` DAGI HOLAT RANGLARIDAN ALOHIDA va bu ataylab:
 * bu yerda ranglar KATEGORIYALARNI ajratadi (ma'no tashimaydi),
 * holat ranglari esa ma'noli (qizil — e'tibor kerak). Ikkisini
 * aralashtirish "yashil kategoriya yaxshi" degan noto'g'ri
 * o'qishni tug'dirardi.
 *
 * ⚠️ RANGLAR VALIDATORDAN O'TKAZILGAN, ko'z bilan tanlanmagan.
 * Har ikki rejim uchun tekshirildi: yorug'lik tasmasi, xroma
 * chegarasi, rang ko'rmaslikda (protan/deutan/tritan) ajralish va
 * fon bilan kontrast. Qiymatni O'ZGARTIRSANGIZ qayta tekshiring —
 * "chiroyliroq" ko'ringan rang ko'pincha daltonikda qo'shnisi
 * bilan qo'shilib ketadi.
 *
 * ⚠️ BIRINCHI IKKI RANG DALTONIKDA YAQIN (ΔE ≈ 6.5 protan):
 * validator ularni "faqat QO'SHIMCHA belgi bilan" deb o'tkazadi.
 * Shuning uchun bu ranglardan foydalangan HAR BIR diagrammada
 * yorliq yoki legenda BO'LISHI SHART — rang yakka o'zi seriyani
 * ajratmaydi.
 *
 * ⚠️ TUNGI RO'YXAT ALOHIDA TANLANGAN, yorug'ining "aylantirilgani"
 * EMAS: to'q fonda quyuq ranglar kontrast chegarasidan o'tmasdi.
 *
 * ⚠️ BIRINCHI SLOT — BREND YASHILI: diagrammada "hal qilingan"
 * chizig'i panelning qolgan qismidagi yashil bilan bir xil
 * ma'noni tashishi kerak.
 *
 * ⚠️ TARTIB QAT'IY, AYLANTIRILMAYDI: rang OBYEKTGA biriktiriladi,
 * uning RO'YXATDAGI O'RNIGA emas. Filtr seriyalar sonini
 * o'zgartirganda qolganlari qayta bo'yalmasligi kerak.
 */

export const CHART_COLORS_LIGHT = [
  "#1d7a4d",
  "#eb6834",
  "#2a78d6",
  "#eda100",
  "#c2185b",
  "#6250d6",
  "#00897b",
] as const;

export const CHART_COLORS_DARK = [
  "#2f9a66",
  "#d4653a",
  "#4a8ad8",
  "#e04f80",
  "#7d6ce0",
  "#b8881c",
  "#179c90",
] as const;

export const chartColors = (isDark: boolean): readonly string[] =>
  isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;

/**
 * TOOLTIP USLUBI — BITTA JOYDA, barcha diagrammalar uchun.
 *
 * ⚠️ RECHARTS TOOLTIPNI o'z inline uslubi bilan chizadi va u
 * mavzuni BILMAYDI: standart holda oq fon qoladi. Tungi rejimda
 * bu ko'zni qamashtirib, sarlavha matni (och kulrang) oq fonda
 * deyarli o'qilmasdi.
 */
export const chartTooltipStyle = (isDark: boolean) =>
  ({
    fontSize: 12,
    borderRadius: 12,
    backgroundColor: isDark ? "#1c1c1c" : "#ffffff",
    border: `1px solid ${isDark ? "#2e2e2e" : "#e2e8e5"}`,
    color: isDark ? "#f5f5f5" : "#0f1a15",
    boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.25)",
  }) as const;

/** O'q/to'r rangi — fonga bosilgan, ma'lumotdan ORQADA turadi. */
export const chartAxisColor = (isDark: boolean) => (isDark ? "#8a8a8a" : "#7b8a83");
export const chartGridColor = (isDark: boolean) => (isDark ? "#2e2e2e" : "#e9eeec");

/**
 * HOLAT RANGLARI — KATEGORIYA RANGLARIDAN ALOHIDA.
 *
 * ⚠️ BU RANGLAR BAND: ular MA'NO tashiydi (ko'k — yangi, sariq —
 * kutmoqda, yashil — hal bo'ldi) va hech qachon "yettinchi
 * kategoriya" sifatida qayta ishlatilmaydi. Aralashtirilsa,
 * diagrammada yashil rang bir joyda "hal qilindi", boshqa joyda
 * "suv ta'minoti" degani bo'lib qolardi.
 *
 * ⚠️ `labels.ts` DAGI `ISSUE_STATUS` BILAN BIR XIL MA'NODA, lekin
 * u Tailwind klassini beradi (rozetka uchun), bu esa HEX —
 * `recharts` SVG'ga faqat hex tushunadi. Ikkisi ham kerak;
 * yorliq matni esa FAQAT `labels.ts` dan olinadi.
 *
 * ⚠️ VALIDATORDAN O'TGAN (yorug' va tungi alohida). `rejected`
 * BILA TURIB NEYTRAL: u "faol emas" degani va xroma chegarasidan
 * ataylab past — rangli bo'lsa, u ham e'tibor talab qilayotgandek
 * ko'rinardi. Shuning uchun u qolgan uchtasi bilan bir ro'yxatda
 * tekshirilmaydi.
 */
export const STATUS_CHART_COLORS_LIGHT = {
  new: "#2a78d6",
  in_progress: "#d98324",
  resolved: "#1d7a4d",
  rejected: "#8a8f8c",
} as const;

export const STATUS_CHART_COLORS_DARK = {
  new: "#4a8ad8",
  in_progress: "#bf7a1e",
  resolved: "#2f9a66",
  rejected: "#8c8c8c",
} as const;

export const statusChartColors = (isDark: boolean) =>
  isDark ? STATUS_CHART_COLORS_DARK : STATUS_CHART_COLORS_LIGHT;
