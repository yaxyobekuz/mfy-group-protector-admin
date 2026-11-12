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

import { ApiError, api, saveBlob } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  AuditEntry,
  CategoryReportRow,
  DailyPoint,
  DistrictMapResponse,
  MahallaMapItem,
  MapIssue,
  MobileReport,
  Paginated,
  RecurringReport,
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

/**
 * TUMANLAR XARITASI — uch oqim (muammo, signal, xavfsizlik) tuman
 * kesimida, bitta so'rovda.
 *
 * ⚠️ `placeholderData`: filtr o'zgarganda xarita BO'SHAB KETMAYDI,
 * eski ranglar yangisi kelguncha turadi. Usiz har bosishda butun
 * viloyat oqarib, "ma'lumot yo'qoldi" degan taassurot berardi.
 */
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

/**
 * TIZIMLI MUAMMOLAR — AYNI MFY, AYNI YO'NALISHDA QAYTA-QAYTA.
 *
 * ⚠️ AYNI FILTRNI OLADI (fayl boshidagi qoida): kesim ekrandagi
 * davrga tegishli bo'lishi kerak.
 */
export const useRecurringReport = (filters: ReportFilters) =>
  useQuery({
    queryKey: queryKeys.reports.recurring(filters),
    queryFn: () => api.get<RecurringReport>("/reports/recurring", { ...filters }),
    placeholderData: (previous) => previous,
  });

/**
 * HISOBOTNI CSV QILIB YUKLAB OLISH.
 *
 * ⚠️ `useQuery` EMAS, `useMutation`: bu SO'ROV emas, AMAL —
 * natijasi ekranda ko'rsatilmaydi, faylga tushadi. `useQuery`
 * bo'lsa, kesh uni saqlab, ikkinchi bosishda eski faylni
 * qaytarardi.
 *
 * ⚠️ FILTR O'SHA EKRANDAGISI: eksport ekranda ko'rinayotgan
 * raqamlardan BOSHQA narsa bermasligi kerak — aks holda
 * rahbariyat ikkisini solishtirib, qaysi biriga ishonishni
 * bilmasdi.
 */
export const useExportReport = () =>
  useMutation({
    mutationFn: async (input: { kind: string; filters: ReportFilters }) => {
      const { blob, filename } = await api.download(
        `/reports/export/${input.kind}`,
        { ...input.filters },
      );

      saveBlob(blob, filename);
    },
    onSuccess: () => {
      toast.success("Hisobot yuklab olindi");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Yuklab olinmadi");
    },
  });

/**
 * HISOBOT YORDAMCHISI — KO'RSATKICH BO'YICHA SAVOL.
 *
 * ⚠️ JAVOB KESHLANMAYDI: u ekranda, savol bergan odamga, bir
 * marta ko'rsatiladi. Keshga qo'yilsa, filtr o'zgargandan keyin
 * ham eski javob turib, BOSHQA davrga tegishli xulosani
 * ko'rsatardi.
 *
 * ⚠️ XATO TOAST QILINMAYDI: javob oynaning ICHIDA ko'rsatiladi
 * (`mutation.error`) — xodim savolini o'sha yerda tuzatib,
 * qaytadan so'raydi. Toast esa yo'qolib ketardi.
 */
export const useReportAssistant = () =>
  useMutation({
    mutationFn: (input: { question: string; filters: ReportFilters }) =>
      api.post<{ answer: string; context: Record<string, unknown> }>(
        "/reports/assistant",
        { question: input.question, ...input.filters },
      ),
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
