/**
 * SANA FORMATI — YAGONA MANBA (panel).
 *
 * ⚠️ BU FAYLDAN BOSHQA JOYDA SANA MATNI YIG'ILMAYDI. Serverdagi
 * `common/date.util.ts` ning ko'zgusi: panel va bot bitta sanani
 * boshqa-boshqa ko'rsatmasligi kerak.
 *
 *   kun         →  21-may, 2025
 *   kun + vaqt  →  21-may, 2025 14:30
 *   oy          →  Yanvar, 2026
 *   vaqt        →  14:30
 *
 * ── TAQIQLANGAN ───────────────────────────────────────────────────────
 *
 * ⚠️ `toLocaleDateString()`, `toLocaleString()`, `Intl.DateTimeFormat`
 * va qo'lda yig'ilgan `${day}.${month}.${year}` ISHLATILMAYDI.
 * Natija kod YOZILGAN joyga emas, kod ISHLAYOTGAN muhitga bog'liq:
 * brauzer tili sozlamasi, OS locale'i. Shu sababli bitta jadvalda
 * bir ustun "21-may, 2025", ikkinchisi "21.05.2025" bo'lib qolardi.
 *
 * ── ISTISNO — ISO QIYMAT FORMAT EMAS ──────────────────────────────────
 *
 * `toISOString().slice(0, 10)` RUXSAT ETILGAN, lekin faqat
 * `<input type="date">` qiymati, so'rov parametri va `queryKey`
 * uchun. Ekranga chiqmaydi — shu uchun `toInputDate` alohida nomda.
 */

const MONTHS_UZ = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  // ⚠️ IMLO QAT'IY: "sentabr"/"oktabr" — "sentyabr"/"oktyabr" EMAS.
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
] as const;

const MONTHS_UZ_CAP = MONTHS_UZ.map(
  (month) => month.charAt(0).toUpperCase() + month.slice(1),
);

/** Bo'sh yoki yaroqsiz qiymat — `Invalid Date` yoki bo'sh satr EMAS. */
const EMPTY = "—";

/** Toshkent (+5), DST yo'q. */
const TASHKENT_OFFSET_MINUTES = 5 * 60;

type DateInput = Date | string | number | null | undefined;

const toDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * TOSHKENT DEVOR-SOATI.
 *
 * ⚠️ `getHours()` ISHLATILMAYDI: u BRAUZERNING zonasini beradi.
 * Xodim boshqa zonada bo'lsa (yoki noutbukining zonasi xato
 * qo'yilgan bo'lsa), "soat 14:30 da kelgan murojaat" boshqa vaqt
 * ko'rsatardi. Tizim esa Asia/Tashkent bo'yicha ishlaydi va
 * hisobot ham shunga qarab quriladi — ya'ni ko'rinish ham shunday
 * bo'lishi kerak.
 */
const toTashkent = (date: Date): Date =>
  new Date(date.getTime() + TASHKENT_OFFSET_MINUTES * 60_000);

const pad = (value: number): string => String(value).padStart(2, "0");

/** "21-may, 2025" */
export const formatDateUz = (value: DateInput): string => {
  const date = toDate(value);
  if (!date) return EMPTY;

  const tz = toTashkent(date);
  // ⚠️ Kun raqami NOLDAN BOSHLANMAYDI: "3-yanvar", "03-yanvar" emas.
  return `${tz.getUTCDate()}-${MONTHS_UZ[tz.getUTCMonth()]}, ${tz.getUTCFullYear()}`;
};

/** "14:30" */
export const formatTimeUz = (value: DateInput): string => {
  const date = toDate(value);
  if (!date) return EMPTY;

  const tz = toTashkent(date);
  return `${pad(tz.getUTCHours())}:${pad(tz.getUTCMinutes())}`;
};

/** "21-may, 2025 14:30" */
export const formatDateTimeUz = (value: DateInput): string => {
  const date = toDate(value);
  if (!date) return EMPTY;

  return `${formatDateUz(date)} ${formatTimeUz(date)}`;
};

/** "Yanvar, 2026" */
export const formatMonthUz = (value: DateInput): string => {
  const date = toDate(value);
  if (!date) return EMPTY;

  const tz = toTashkent(date);
  return `${MONTHS_UZ_CAP[tz.getUTCMonth()]}, ${tz.getUTCFullYear()}`;
};

/**
 * NISBIY VAQT — "5 daqiqa oldin".
 *
 * ⚠️ FAQAT YAQIN O'TMISH UCHUN. Bir kundan oshsa to'liq sanaga
 * o'tadi: "23 kun oldin" degan yorliq odamga hech narsa bermaydi va
 * u baribir aniq sanani izlardi.
 *
 * ⚠️ `Intl.RelativeTimeFormat` ISHLATILMAYDI — u ham locale'ga
 * bog'liq va o'zbek tilida ba'zi muhitlarda ingliz tilida chiqardi.
 */
export const formatRelativeUz = (value: DateInput): string => {
  const date = toDate(value);
  if (!date) return EMPTY;

  const diffMs = Date.now() - date.getTime();

  // Kelajakdagi sana (muddat) — nisbiy ko'rsatilmaydi.
  if (diffMs < 0) return formatDateTimeUz(date);

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "hozir";
  if (minutes < 60) return `${minutes} daqiqa oldin`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;

  return formatDateTimeUz(date);
};

/**
 * `<input type="date">` QIYMATI ("2025-05-21").
 *
 * ⚠️ FORMAT EMAS, ISO QIYMAT — ekranga chiqmaydi. Nomi shuning
 * uchun `format*` emas: ikkisini chalkashtirmaslik kerak.
 *
 * ⚠️ TOSHKENT KUNI bo'yicha: `toISOString()` ni to'g'ridan-to'g'ri
 * olsa, mahalliy 01:00 dagi sana KECHAGI kunga tushib qolardi.
 */
export const toInputDate = (value: DateInput): string => {
  const date = toDate(value);
  if (!date) return "";

  return toTashkent(date).toISOString().slice(0, 10);
};

/** Bugundan N kun oldingi Toshkent kuni — hisobot filtri uchun. */
export const daysAgoInput = (days: number): string => {
  const date = new Date(Date.now() - days * 86_400_000);
  return toInputDate(date);
};
