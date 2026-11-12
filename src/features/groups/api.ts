/**
 * TELEGRAM GURUHLARI — query va mutatsiyalar.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  BulkGroupInput,
  BulkResult,
  GroupStats,
  Paginated,
  TelegramGroup,
} from "@/shared/api/types";

export interface GroupFilters {
  isOfficial?: boolean;
  /**
   * ⚠️ SHAHAR/TUMAN KESIMI: viloyatda BIR XIL NOMLI MFY lar bor
   * (har tumanda "Turon", "Birlik") va tumansiz ro'yxatda ular
   * farqlanmasdi.
   */
  districtId?: string;
  mahallaId?: string;
  unassigned?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/** `GroupFilters` → ommaviy amalning filtri. */
export const toBulkFilter = (
  filters: GroupFilters,
  expectedCount: number,
): BulkGroupInput => ({
  filterIsOfficial: filters.isOfficial,
  // ⚠️ TUMAN HAM UZATILADI: ommaviy amalning qamrovi — EKRANDAGI
  // filtr natijasi. Tushib qolsa, operator bitta tumanni ko'rib
  // turib, amalni butun viloyatga bajarardi.
  filterDistrictId: filters.districtId,
  filterMahallaId: filters.mahallaId,
  filterUnassigned: filters.unassigned,
  filterSearch: filters.search,
  expectedCount,
});

export const useGroups = (filters: GroupFilters) =>
  useQuery({
    queryKey: queryKeys.groups.list(filters),
    queryFn: () => api.get<Paginated<TelegramGroup>>("/groups", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useGroupStats = () =>
  useQuery({
    queryKey: queryKeys.groups.stats(),
    queryFn: () => api.get<GroupStats>("/groups/stats"),
  });

/**
 * RASMIY BELGISINI QO'YADI/OLADI — ENG SEZGIR AMAL.
 *
 * ⚠️ SHU BELGI QO'YILGANDAN KEYIN TIZIM GURUHDAGI XABARLARNI
 * O'QIY BOSHLAYDI. Shuning uchun xabar matni ham shunga mos:
 * "kuzatuv yoqildi" deyiladi, "saqlandi" emas — operator nima
 * qilganini aniq bilishi kerak.
 *
 * ⚠️ MFY MAJBURIY: server biriktirilmagan guruhni rasmiy qilishni
 * rad etadi (signallar hududsiz qolardi) va o'sha matn shu yerda
 * ko'rsatiladi.
 */
export const useSetOfficial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { chatId: string; isOfficial: boolean }) =>
      api.patch<{ chatId: string; isOfficial: boolean }>(
        `/groups/${input.chatId}/official`,
        { isOfficial: input.isOfficial },
      ),
    onSuccess: (result) => {
      if (result.isOfficial) {
        toast.success("Kuzatuv yoqildi", {
          description: "Guruhdagi xabarlar tahlilga tushadi.",
        });
      } else {
        toast.success("Kuzatuv o'chirildi", {
          // ⚠️ NAVBAT TOZALANGANI AYTILADI: server tahlilsiz
          // xabarlarni o'chiradi va operator buni bilishi kerak
          // ("qayta yoqsam, eski xabarlar ko'riladimi?" — yo'q).
          description: "Tahlil qilinmagan xabarlar o'chirildi.",
        });
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
      // ⚠️ SIGNALLAR SANOG'I HAM: kuzatuv o'chirilsa navbat
      // o'zgaradi va sarlavhadagi raqam eskirmasligi kerak.
      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};

/**
 * OMMAVIY KUZATUV — filtrdan o'tgan barcha guruh uchun.
 *
 * ⚠️ `chatId` RO'YXATI EMAS, FILTR YUBORILADI: ro'yxat sahifalangan
 * va panel faqat 50 tasini biladi. Id ro'yxati yuborilsa,
 * "hammasiga yoqdim" degan odam aslida birinchi sahifani yoqqan
 * bo'lardi.
 *
 * ⚠️ `expectedCount` — TASDIQ: tasdiqlash oynasidagi raqam bilan
 * amal paytidagi raqam boshqa bo'lsa, server rad etadi.
 */
export const useBulkSetOfficial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkGroupInput & { isOfficial: boolean }) =>
      api.patch<BulkResult>("/groups/bulk/official", input),

    onSuccess: (result, input) => {
      // ⚠️ NATIJA TO'LIQ AYTILADI: MFYsiz guruhlar JIM o'tkazib
      // yuborilsa, operator "hammasi yoqildi" deb o'ylab,
      // o'nlab guruh kuzatuvsiz qolardi va buni hech narsa
      // ko'rsatmasdi.
      const parts: string[] = [];
      if (result.unchanged > 0) parts.push(`${result.unchanged} tasi allaqachon shunday edi`);
      if (result.skippedNoMahalla) {
        parts.push(`${result.skippedNoMahalla} tasi MFY biriktirilmagani uchun o'tkazib yuborildi`);
      }
      if (result.purgedMessages) {
        parts.push(`${result.purgedMessages} tahlilsiz xabar o'chirildi`);
      }

      toast.success(
        input.isOfficial
          ? `Kuzatuv yoqildi: ${result.changed} ta guruh`
          : `Kuzatuv o'chirildi: ${result.changed} ta guruh`,
        { description: parts.join(". ") || undefined },
      );

      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });
    },

    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};

/**
 * MFY BIRIKTIRADI.
 *
 * ⚠️ O'TGAN MUROJAATLAR QAYTA YOZILMAYDI: `Issue.mahallaId`
 * muhrlangan. Shuning uchun xabar matni "keyingi signallar"
 * deyiladi — operator "eski hisobot o'zgaradimi?" degan savolga
 * javob olishi kerak.
 */
export const useAssignMahalla = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { chatId: string; mahallaId: string | null }) =>
      api.patch(`/groups/${input.chatId}/mahalla`, { mahallaId: input.mahallaId }),
    onSuccess: (_result, input) => {
      toast.success(
        input.mahallaId ? "MFY biriktirildi" : "MFY biriktirishi yechildi",
        {
          description: input.mahallaId
            ? "Keyingi signallar shu hududga tushadi. Eski murojaatlar o'zgarmaydi."
            : undefined,
        },
      );

      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};
