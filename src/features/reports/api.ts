/**
 * HISOBOTLAR, SOZLAMALAR VA AUDIT.
 *
 * ⚠️ BARCHA KESIMLAR AYNI FILTRNI OLADI (`ReportFilters`): server
 * tomonida ham ular bitta `baseWhere()` ustiga quriladi. Filtrni
 * har kesim uchun alohida yuborish ikki tabda ikki xil "jami"
 * ko'rsatishga olib kelardi.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  AuditEntry,
  CategoryReportRow,
  DailyPoint,
  Paginated,
  ReportOverview,
  Settings,
  SignalReport,
  SignalSeverity,
  TerritoryReport,
} from "@/shared/api/types";

export interface ReportFilters {
  from?: string;
  to?: string;
  districtId?: string;
  mahallaId?: string;
  categoryId?: string;
}

export const useReportOverview = (filters: ReportFilters) =>
  useQuery({
    queryKey: queryKeys.reports.overview(filters),
    queryFn: () => api.get<ReportOverview>("/reports/overview", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useTerritoryReport = (filters: ReportFilters) =>
  useQuery({
    queryKey: queryKeys.reports.territory(filters),
    queryFn: () => api.get<TerritoryReport>("/reports/territory", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useCategoryReport = (filters: ReportFilters) =>
  useQuery({
    queryKey: queryKeys.reports.categories(filters),
    queryFn: () => api.get<CategoryReportRow[]>("/reports/categories", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useSignalReport = (filters: ReportFilters) =>
  useQuery({
    queryKey: queryKeys.reports.signals(filters),
    queryFn: () => api.get<SignalReport>("/reports/signals", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useDailyReport = (days: number) =>
  useQuery({
    queryKey: queryKeys.reports.daily(days),
    queryFn: () => api.get<DailyPoint[]>("/reports/daily", { days }),
    placeholderData: (previous) => previous,
  });

// ═══════════════════════════════════════════════════════════════════
//  SOZLAMALAR
// ═══════════════════════════════════════════════════════════════════

export const useSettings = () =>
  useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: () => api.get<Settings>("/settings"),
    // ⚠️ `orgName` sarlavhada ishlatiladi — har navigatsiyada
    // so'ralmasligi kerak.
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

// ═══════════════════════════════════════════════════════════════════
//  AUDIT
// ═══════════════════════════════════════════════════════════════════

export interface AuditFilters {
  action?: string;
  userId?: string;
  entity?: string;
  page?: number;
  limit?: number;
}

export const useAudit = (filters: AuditFilters) =>
  useQuery({
    queryKey: queryKeys.audit.list(filters),
    queryFn: () => api.get<Paginated<AuditEntry>>("/audit", { ...filters }),
    placeholderData: (previous) => previous,
  });
