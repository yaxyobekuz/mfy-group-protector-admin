"use client";

/**
 * SESSIYA — kim kirgan, nimaga ruxsati bor.
 *
 * ── RUXSAT TOKENDAN O'QILMAYDI ────────────────────────────────────────
 *
 * ⚠️ `GET /auth/me` har yuklanishda chaqiriladi va ruxsatlar SHUNDAN
 * keladi. Tokenga muhrlangan ro'yxatdan o'qish bir so'rovni
 * tejardi, lekin ruxsat olib qo'yilgan xodim token muddati
 * tugamaguncha (15 daqiqa) eski huquqlar bilan ishlab yuraverardi.
 * Serverdagi `JwtAuthGuard` ham AYNI shunday qiladi — ya'ni ikki
 * tomon bir xil haqiqatni ko'radi.
 *
 * ── HIMOYA SERVERDA ───────────────────────────────────────────────────
 *
 * ⚠️ `can()` FAQAT KO'RINISH uchun: tugmani yashirish, menyuni
 * filtrlash. Haqiqiy himoya serverda (`@RequirePermissions`).
 * Foydalanuvchi URL'ni qo'lda yozsa ham server uni to'xtatadi —
 * panel esa shunchaki chiroyli xato ko'rsatadi.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import { api, setSessionEndHandler, tokens } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { LoginResponse, MeResponse, UserRole } from "@/shared/api/types";

interface SessionValue {
  user: MeResponse | null;
  isLoading: boolean;
  /** Ruxsat bormi — faqat KO'RINISH uchun (yuqoridagi izoh). */
  can: (permission: string) => boolean;
  /** Viloyat darajasidagi xodimmi (barcha tumanlarni ko'radi). */
  isProvinceWide: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => api.get<MeResponse>("/auth/me"),
    /**
     * ⚠️ TOKEN BO'LMASA SO'ROV YUBORILMAYDI: aks holda login
     * sahifasida ham `/auth/me` ketib, 401 olib, konsolni
     * to'ldirardi.
     */
    enabled: Boolean(tokens.access()),
    /**
     * ⚠️ QAYTA URINILMAYDI: 401 — "token yaroqsiz" degan ANIQ
     * javob va uni uch marta takrorlash hech narsani o'zgartirmaydi,
     * faqat login sahifasiga o'tishni sekinlashtiradi.
     */
    retry: false,
    staleTime: 60_000,
  });

  /**
   * SESSIYA TUGAGANDA — login sahifasiga.
   *
   * ⚠️ `client.ts` BU FUNKSIYANI CHAQIRADI, chunki u React
   * daraxtidan tashqarida va `useRouter` ni chaqira olmaydi.
   */
  useEffect(() => {
    setSessionEndHandler(() => {
      // ⚠️ KESH TOZALANADI: tozalanmasa, boshqa xodim kirganda
      // oldingisining ma'lumoti bir lahza ko'rinib ketardi.
      queryClient.clear();
      router.replace("/login");
    });

    return () => setSessionEndHandler(null);
  }, [queryClient, router]);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await api.post<LoginResponse>(
        "/auth/login",
        { username, password },
        // ⚠️ `skipAuth`: eski (yaroqsiz) token yuborilsa, server
        // uni e'tiborsiz qoldiradi, lekin yuborishning ma'nosi
        // yo'q — va `Authorization` sarlavhasi ba'zi proxy'larda
        // keshga tushib muammo berardi.
        { skipAuth: true },
      );

      tokens.save(result.accessToken, result.refreshToken);

      // ⚠️ `setQueryData` + `invalidate` EMAS, faqat
      // `invalidateQueries`: login javobidagi `user` shakli
      // `/auth/me` dan FARQ QILADI (`districtName` bor) va uni
      // keshga qo'yish keyingi o'qishda noto'g'ri tur berardi.
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });

      router.replace("/");
    },
    [queryClient, router],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokens.refresh();

    // ⚠️ SERVERGA XABAR BERISH MAJBURIY EMAS: sessiya baribir
    // muddati bilan tugaydi. Lekin aytilsa, refresh token DARHOL
    // bekor bo'ladi — shuning uchun urinib ko'ramiz va xatoni jim
    // o'tkazamiz.
    try {
      await api.post("/auth/logout", { refreshToken }, { skipAuth: true });
    } catch {
      // Chiqish IDEMPOTENT bo'lishi kerak.
    }

    tokens.clear();
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  const value = useMemo<SessionValue>(() => {
    const user = data ?? null;
    const role: UserRole | undefined = user?.role;

    return {
      user,
      isLoading,
      can: (permission) => {
        if (!user) return false;
        // ⚠️ `owner` RO'YXATDAN O'QILMAYDI — serverdagi
        // `PermissionsGuard` bilan AYNI mantiq. Uning massivi bo'sh
        // bo'lishi mumkin va bu normal.
        if (role === "owner") return true;
        return user.permissions.includes(permission);
      },
      isProvinceWide: role === "owner" || user?.scopeKind === "province",
      login,
      logout,
    };
  }, [data, isLoading, login, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

/**
 * ⚠️ PROVIDER TASHQARISIDA CHAQIRILSA XATO OTADI, `null`
 * qaytarmaydi: `null` holatida chaqiruvchi kod `user?.can(...)`
 * yozib, tekshiruv JIM `false` bo'lib ketardi — ya'ni tugmalar
 * sababsiz yo'qolardi va buni topish qiyin bo'lardi.
 */
export const useSession = (): SessionValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession faqat <AuthProvider> ichida ishlaydi");
  }
  return context;
};
