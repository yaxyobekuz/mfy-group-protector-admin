/**
 * API MIJOZI — serverga barcha so'rovlar shu yerdan o'tadi.
 *
 * ── TOKENLAR QAYERDA SAQLANADI ────────────────────────────────────────
 *
 * ⚠️ `localStorage` ISHLATILADI va bu ongli savdo. Eng xavfsiz
 * variant — `httpOnly` cookie, lekin u panel BOSHQA DOMENDA
 * bo'lgani uchun `SameSite=None; Secure` talab qiladi: HTTPS'siz
 * ishlamaydi va ba'zi brauzerlarda umuman bloklanadi. Bu ichki
 * panel (tashqi foydalanuvchi yo'q), XSS yuzasi kichik va
 * `localStorage` har muhitda bir xil ishlaydi.
 *
 * Shuning uchun himoya BOSHQA joydan keladi: access token QISQA
 * (15 daqiqa) va refresh ROTATSIYA bilan (serverda qayta
 * ishlatilgan token butun sessiyani yopadi).
 *
 * ── AVTOMATIK YANGILASH ───────────────────────────────────────────────
 *
 * ⚠️ 401 OLGANDA BIR MARTA refresh qilinadi va so'rov QAYTA
 * YUBORILADI. Usiz foydalanuvchi har 15 daqiqada tizimdan chiqib
 * ketardi.
 *
 * ⚠️ PARALLEL 401'LAR BITTA REFRESH'NI KUTADI (`refreshPromise`).
 * Sahifa yuklanganda 5 ta so'rov birga ketadi va hammasi 401 olsa,
 * ularning har biri alohida refresh yuborardi — serverdagi
 * ROTATSIYA esa birinchisidan keyin qolganlarini "qayta
 * ishlatilgan token" deb hisoblab, BUTUN SESSIYANI yopardi. Ya'ni
 * foydalanuvchi har sahifa yangilashda tizimdan chiqib ketardi.
 */

/**
 * ⚠️ EKSPORT QILINADI: fayl yuklash (`FormData`) `send()` dan
 * O'TMAYDI — u har so'rovga `Content-Type: application/json`
 * qo'yadi va bu `FormData` ning `boundary` sini buzardi. Shuning
 * uchun muqova yuklash o'z `fetch` ini yozadi va unga manzil kerak
 * (`features/announcements/api.ts`).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/**
 * YUKLANGAN FAYLLAR ILDIZI.
 *
 * ⚠️ `/api` OLIB TASHLANADI: fayllar `api` prefiksidan TASHQARIDA
 * turadi (`server/src/main.ts`) va server `/uploads/...`
 * ko'rinishidagi NISBIY manzil qaytaradi.
 */
const FILE_ORIGIN = API_URL.replace(/\/api\/?$/, "");

/** Serverdan kelgan nisbiy manzilni to'liq manzilga aylantiradi. */
export const fileUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${FILE_ORIGIN}${path}`;
};

const ACCESS_KEY = "vsh.access";
const REFRESH_KEY = "vsh.refresh";

/** Server qaytaradigan xato shakli (`AllExceptionsFilter`). */
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * ⚠️ XATO KLASSI: `fetch` 4xx/5xx da xato OTMAYDI va buni har
 * chaqiruv joyida tekshirish kerak bo'lardi. TanStack Query esa
 * otilgan xatoni o'zi ushlaydi (`isError`), ya'ni bu yerda otish
 * to'g'ri yo'l.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ═══════════════════════════════════════════════════════════════════
//  TOKEN SAQLASH
// ═══════════════════════════════════════════════════════════════════

/**
 * ⚠️ `typeof window` TEKSHIRILADI: Next'da bu modul SERVER
 * tomonida ham yuklanishi mumkin (komponent import zanjiri orqali)
 * va u yerda `localStorage` YO'Q — `ReferenceError` bilan butun
 * sahifa yiqilardi.
 */
const isBrowser = (): boolean => typeof window !== "undefined";

export const tokens = {
  access: (): string | null => (isBrowser() ? localStorage.getItem(ACCESS_KEY) : null),
  refresh: (): string | null => (isBrowser() ? localStorage.getItem(REFRESH_KEY) : null),

  save(access: string, refresh: string): void {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },

  clear(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ═══════════════════════════════════════════════════════════════════
//  YANGILASH
// ═══════════════════════════════════════════════════════════════════

/** Hozir ishlayotgan refresh (bo'lmasa `null`) — yuqoridagi izoh. */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Sessiya tugaganda chaqiriladi — `AuthProvider` o'rnatadi.
 *
 * ⚠️ `router.push` BU YERDA ISHLATILMAYDI: bu modul React
 * daraxtidan TASHQARIDA va unda hook chaqirib bo'lmaydi.
 * Yo'naltirishni provider qiladi.
 */
let onSessionEnd: (() => void) | null = null;

export const setSessionEndHandler = (handler: (() => void) | null): void => {
  onSessionEnd = handler;
};

const doRefresh = async (): Promise<boolean> => {
  const refreshToken = tokens.refresh();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
    };

    tokens.save(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
};

const refreshOnce = (): Promise<boolean> => {
  // ⚠️ BITTA REFRESH — fayl boshidagi izoh.
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

// ═══════════════════════════════════════════════════════════════════
//  SO'ROV
// ═══════════════════════════════════════════════════════════════════

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Query parametrlari — `undefined` va `null` TASHLANADI. */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Tokensiz so'rov (login, refresh). */
  skipAuth?: boolean;
}

/**
 * ⚠️ `undefined` VA `null` PARAMETRLAR TASHLANADI. Aks holda
 * `?status=undefined` ketib, server `@IsEnum` da yiqilardi — va
 * panel "filtr tanlanmagan" holatini shunday yuborishi tabiiy.
 */
const buildUrl = (path: string, params?: RequestOptions["params"]): string => {
  const url = new URL(`${API_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

async function send<T>(path: string, options: RequestOptions, retried: boolean): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (!options.skipAuth) {
    const token = tokens.access();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  // ── 401: tokenni yangilab, BIR MARTA qayta urinish ──────────────
  if (response.status === 401 && !options.skipAuth && !retried) {
    const refreshed = await refreshOnce();

    if (refreshed) return send<T>(path, options, true);

    // ⚠️ YANGILANMADI — SESSIYA TUGADI. Tokenlar tozalanadi va
    // provider login sahifasiga yo'naltiradi. Tozalanmasa, panel
    // eskirgan token bilan cheksiz 401 olib aylanardi.
    tokens.clear();
    onSessionEnd?.();

    throw new ApiError(401, "Sessiya tugadi — qaytadan kiring");
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const error = payload as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      // ⚠️ SERVER MATNI ISHLATILADI: u o'zbek tilida va
      // foydalanuvchiga mo'ljallangan ("Bu oxirgi faol
      // kategoriya..."). Panelda ikkinchi marta tarjima qilish
      // ikki joyda matn saqlashga olib kelardi.
      error?.message ?? `Server xatosi (${response.status})`,
      error?.errors,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, params?: RequestOptions["params"]): Promise<T> =>
    send<T>(path, { method: "GET", params }, false),

  post: <T>(path: string, body?: unknown, options?: { skipAuth?: boolean }): Promise<T> =>
    send<T>(path, { method: "POST", body, skipAuth: options?.skipAuth }, false),

  patch: <T>(path: string, body?: unknown): Promise<T> =>
    send<T>(path, { method: "PATCH", body }, false),

  delete: <T>(path: string): Promise<T> => send<T>(path, { method: "DELETE" }, false),
};
