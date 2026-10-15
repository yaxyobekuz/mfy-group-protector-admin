/**
 * XAVFSIZLIK — query va mutatsiyalar.
 *
 * ⚠️ SIGNALLARDAN ALOHIDA BO'LIM: signal — AI taxmini va u odam
 * qaroriga muhtoj; bu yerda esa bot ALLAQACHON harakat qilgan
 * (xabar o'chirilgan). Shuning uchun bu yerda "biriktirish" yoki
 * "e'tiborsiz qoldirish" kabi mutatsiyalar YO'Q — jurnal
 * append-only.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  Paginated,
  SecurityEvent,
  SecurityStats,
  ThreatAction,
  ThreatKind,
} from "@/shared/api/types";

export interface SecurityFilters {
  chatId?: string;
  kind?: ThreatKind;
  action?: ThreatAction;
  districtId?: string;
  mahallaId?: string;
  senderTgId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const useSecurityEvents = (filters: SecurityFilters) =>
  useQuery({
    queryKey: queryKeys.security.list(filters),
    queryFn: () =>
      api.get<Paginated<SecurityEvent>>("/security/events", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useSecurityStats = () =>
  useQuery({
    queryKey: queryKeys.security.stats(),
    queryFn: () => api.get<SecurityStats>("/security/stats"),
  });

/**
 * QALQONNI YOQADI/O'CHIRADI — SEZGIR AMAL.
 *
 * ⚠️ XABAR MATNI NIMA BO'LISHINI ANIQ AYTADI: "qalqon yoqildi"
 * emas, "bot endi zararli xabarlarni O'CHIRADI" — operator
 * qaytarib bo'lmaydigan amalni yoqayotganini bilishi kerak.
 *
 * ⚠️ `groups` KESHI HAM BEKOR QILINADI: qalqon holati guruhlar
 * ro'yxatida ham ko'rinadi va faqat `security` ni bekor qilish
 * "yoqdim, lekin ro'yxatda o'chiq turibdi" holatini berardi.
 */
export const useSetGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      guardEnabled,
    }: {
      chatId: string;
      guardEnabled: boolean;
    }) =>
      api.patch<{ chatId: string; guardEnabled: boolean }>(
        `/security/groups/${chatId}/guard`,
        { guardEnabled },
      ),

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.security.all() });

      toast.success(
        variables.guardEnabled
          ? "Qalqon yoqildi — bot zararli fayl va havolalarni o'chiradi"
          : "Qalqon o'chirildi — bot endi hech narsani o'chirmaydi",
      );
    },

    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Amal bajarilmadi",
      );
    },
  });
};
