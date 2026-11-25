/**
 * HISOBOT KESIMLARI VA SOZLAMALAR.
 *
 * ⚠️ "Hisobotlar" SAHIFASI OLIB TASHLANGAN (2026-11-25), lekin bu
 * fayl QOLADI: undagi kesimlarning bir qismini BOSH SAHIFA
 * (`useCategoryReport`, `useDailyReport`, `useMobileReport`),
 * XARITA (`useMapReport`, `useMahallaMap`) va tuman xaritasi
 * paneli (`useDistrictMap`) ishlatadi. Faqat o'sha sahifaga
 * tegishli kesimlar (umumiy ko'rinish, hudud, signal kesimi,
 * takrorlanish, eksport, AI yordamchisi) olib tashlandi.
 *
 * ⚠️ AUDIT BO'LIMI HAM OLIB TASHLANDI — jurnal butunlay
 * yo'q qilindi (sahifa, API va yozish).
 *
 * ⚠️ BARCHA KESIMLAR AYNI FILTRNI OLADI (`ReportFilters`): server
 * tomonida ham ular bitta `baseWhere()` ustiga quriladi.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  CategoryReportRow,
  DailyPoint,
  DistrictMapResponse,
  MahallaMapItem,
  MapIssue,
  MobileReport,
  Paginated,
  Settings,
  SignalSeverity,
} from "@/shared/api/types";

export interface ReportFilters {
  from?: string;
  to?: string;
  districtId?: string;
  mahallaId?: string;
  categoryId?: string;
}

export const useCategoryReport = (filters: ReportFilters) =>
  useQuery({
    queryKey: queryKeys.reports.categories(filters),
    queryFn: () => api.get<CategoryReportRow[]>("/reports/categories", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useDistrictMap = (filters: ReportFilters) =>
  useQuery({
    queryKey: queryKeys.reports.districtMap(filters),
    queryFn: () => api.get<DistrictMapResponse>("/reports/district-map", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useDailyReport = (days: number) =>
  useQuery({
    queryKey: queryKeys.reports.daily(days),
    queryFn: () => api.get<DailyPoint[]>("/reports/daily", { days }),
    placeholderData: (previous) => previous,
  });

/** Mini App (fuqaro murojaatlari) analitikasi. */
export const useMobileReport = (filters: ReportFilters) =>
  useQuery({
    queryKey: queryKeys.reports.mobile(filters),
    queryFn: () => api.get<MobileReport>("/reports/mobile", { ...filters }),
    placeholderData: (previous) => previous,
  });

/** Xarita nuqtalari (koordinatali murojaatlar). */
export const useMapReport = (filters: ReportFilters & { status?: string }) =>
  useQuery({
    queryKey: queryKeys.reports.map(filters),
    queryFn: () => api.get<MapIssue[]>("/reports/map", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useSettings = () =>
  useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: () => api.get<Settings>("/settings"),
    // ⚠️ `orgName` sarlavhada ishlatiladi — har navigatsiyada
    // so'ralmasligi kerak.
    staleTime: 5 * 60_000,
  });

/**
 * MFY KESIMI — ISSIQLIK XARITASI VA POLIGONLAR UCHUN.
 *
 * ⚠️ `useMapReport` DAN ALOHIDA: u faqat KOORDINATALI
 * murojaatlarni beradi (2000 ta bilan cheklangan), bu esa HAMMA
 * murojaatni MFY bo'yicha sanaydi — koordinatasizlarini ham.
 *
 * ⚠️ YO'NALISH BO'YICHA KESIM BIRGA KELADI (`byCategory`): filtr
 * mijozda, SO'ROVSIZ ishlaydi — har chip bosilganda serverga borish
 * xaritani sekinlashtirardi.
 */
export const useMahallaMap = (filters: ReportFilters & { status?: string }) =>
  useQuery({
    queryKey: queryKeys.reports.mahallaMap(filters),
    queryFn: () => api.get<MahallaMapItem[]>("/reports/mahalla-map", { ...filters }),
    placeholderData: (previous) => previous,
    // ⚠️ UZUN: MFY chegaralari deyarli o'zgarmaydi va javob
    // og'ir (poligonlar bilan).
    staleTime: 5 * 60_000,
  });

export const useSaveSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      orgName?: string;
      aiEnabled?: boolean;
      aiIntervalMinutes?: number;
      aiMaxMessagesPerRun?: number;
      messageRetentionHours?: number;
      alertChatIds?: string[];
      alertMinSeverity?: SignalSeverity;
      guardDeleteFiles?: boolean;
      guardDeleteUrls?: boolean;
      guardBlockedHosts?: string[];
      guardAllowedHosts?: string[];
      mobileDailyLimit?: number;
      mobileMaxAttachments?: number;
      /** ⚠️ Standart `true` — telefonsiz murojaat qabul qilinmaydi. */
      requirePhone?: boolean;
    }) => api.patch<Settings>("/settings", input),
    onSuccess: () => {
      toast.success("Sozlamalar saqlandi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
      // ⚠️ SIGNAL HOLATI HAM: `aiEnabled` o'zgarsa, "AI yoqilgan"
      // satri darhol yangilanishi kerak.
      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.status() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Saqlanmadi");
    },
  });
};
