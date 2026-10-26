/**
 * QUERY KALITLARI — YAGONA MANBA.
 *
 * ⚠️ KALIT QO'LDA YOZILMAYDI (`["signals", filters]` kabi). Sabab:
 * `invalidateQueries` kalitni AYNAN topishi kerak va qo'lda
 * yozilgan kalitlar ajralib ketganda keshni bekor qilish JIM
 * ISHLAMAY qoladi — ro'yxat eski ma'lumotni ko'rsatib turadi va
 * foydalanuvchi "signalni biriktirdim, lekin ro'yxatda hali ham
 * yangi" deb hayron bo'ladi.
 *
 * ⚠️ IERARXIYA MUHIM: `["signals"]` bilan bekor qilinganda uning
 * ichidagi hamma narsa (`list`, `counts`, `status`) ham bekor
 * bo'ladi. Shuning uchun har kalit o'z bo'limi nomidan boshlanadi.
 */

/**
 * Kalit ichidagi parametrlar.
 *
 * ⚠️ `Record<string, unknown>` EMAS: interfeys (`SignalFilters`,
 * `IssueFilters`) unga to'g'ri kelmaydi — TypeScript'da e'lon
 * qilingan interfeysda indeks imzosi bo'lmaydi. `object` esa
 * hammasini qabul qiladi va kalit baribir `JSON.stringify` orqali
 * hisoblanadi, ya'ni aniq tur bu yerda hech narsa bermaydi.
 */
type QueryParams = object;

export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },

  territory: {
    all: () => ["territory"] as const,
    districts: (params?: QueryParams) =>
      ["territory", "districts", params ?? {}] as const,
    mahallas: (params?: QueryParams) =>
      ["territory", "mahallas", params ?? {}] as const,
  },

  groups: {
    all: () => ["groups"] as const,
    list: (params?: QueryParams) => ["groups", "list", params ?? {}] as const,
    stats: () => ["groups", "stats"] as const,
  },

  security: {
    all: () => ["security"] as const,
    list: (params?: QueryParams) => ["security", "list", params ?? {}] as const,
    stats: () => ["security", "stats"] as const,
  },

  signals: {
    all: () => ["signals"] as const,
    list: (params?: QueryParams) => ["signals", "list", params ?? {}] as const,
    counts: () => ["signals", "counts"] as const,
    status: () => ["signals", "status"] as const,
  },

  issues: {
    all: () => ["issues"] as const,
    list: (params?: QueryParams) => ["issues", "list", params ?? {}] as const,
    detail: (id: string) => ["issues", "detail", id] as const,
    stats: () => ["issues", "stats"] as const,
    categories: (activeOnly?: boolean) =>
      ["issues", "categories", activeOnly ?? false] as const,
  },

  users: {
    all: () => ["users"] as const,
    list: (params?: QueryParams) => ["users", "list", params ?? {}] as const,
    catalog: () => ["users", "permissions-catalog"] as const,
  },

  reports: {
    all: () => ["reports"] as const,
    overview: (params?: QueryParams) =>
      ["reports", "overview", params ?? {}] as const,
    territory: (params?: QueryParams) =>
      ["reports", "territory", params ?? {}] as const,
    categories: (params?: QueryParams) =>
      ["reports", "categories", params ?? {}] as const,
    signals: (params?: QueryParams) =>
      ["reports", "signals", params ?? {}] as const,
    daily: (days: number) => ["reports", "daily", days] as const,
    mobile: (params?: QueryParams) =>
      ["reports", "mobile", params ?? {}] as const,
    map: (params?: QueryParams) => ["reports", "map", params ?? {}] as const,
  },

  settings: {
    all: () => ["settings"] as const,
  },

  audit: {
    list: (params?: QueryParams) => ["audit", "list", params ?? {}] as const,
  },

  citizens: {
    all: () => ["citizens"] as const,
    list: (params?: QueryParams) => ["citizens", "list", params ?? {}] as const,
    detail: (id: string) => ["citizens", "detail", id] as const,
  },

  announcements: {
    all: () => ["announcements"] as const,
    list: (params?: QueryParams) => ["announcements", "list", params ?? {}] as const,
  },
} as const;
