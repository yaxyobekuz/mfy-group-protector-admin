/**
 * QAMROV — bot qaysi MFY larga kirgan, qaysilariga kirmagan.
 *
 * ⚠️ FILTR OLMAYDI va bu ataylab: qamrov — HOZIRGI holat, davr
 * kesimi emas. "O'tgan oyda bot nechta MFY da bor edi" degan savol
 * ma'nosiz — bugun nima qilish kerakligini bilish uchun bugungi
 * holat kerak. Shuning uchun `ReportFilters` ham uzatilmaydi.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api, saveBlob } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { CoverageReport } from "@/shared/api/types";

export const useCoverageReport = () =>
  useQuery({
    queryKey: queryKeys.reports.coverage(),
    queryFn: () => api.get<CoverageReport>("/reports/coverage"),
    /**
     * ⚠️ `staleTime` QISQA (1 daqiqa): xodim guruhni MFY ga
     * biriktirgandan keyin shu sahifaga qaytib, natijani ko'rishi
     * kerak. Uzoq bo'lsa, u "biriktirdim, lekin hisobot
     * o'zgarmadi" deb o'ylab, ikkinchi marta biriktirardi.
     */
    staleTime: 60_000,
  });

/**
 * QAMROVNI CSV QILIB YUKLAB OLISH.
 *
 * ⚠️ `kind` IKKI XIL, IKKI RUXSAT BILAN:
 *
 *   `coverage`           → `reports.view` (yig'ma son, rahbariyat)
 *   `unassigned-groups`  → `groups.view`  (xom ro'yxat, reyestr ishi)
 *
 * Server ularni ALOHIDA marshrutda ushlaydi — ya'ni ruxsati
 * yo'q odam 403 oladi va bu yerda tekshirish kerak emas. Tugma
 * baribir yashiriladi (`can()`), lekin bu faqat qulaylik.
 */
export const useExportCoverage = () =>
  useMutation({
    mutationFn: async (kind: "coverage" | "unassigned-groups") => {
      const { blob, filename } = await api.download(`/reports/export/${kind}`);
      saveBlob(blob, filename);
    },
    onSuccess: () => {
      toast.success("Hisobot yuklab olindi");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Yuklab olinmadi");
    },
  });
