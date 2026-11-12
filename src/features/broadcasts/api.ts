/**
 * TARQATMA — query va mutatsiyalar.
 *
 * ⚠️ YUBORISH FON JARAYONI: server yozuvni yaratib, darhol javob
 * qaytaradi va xabarlarni keyin tarqatadi. Shuning uchun "yuborildi"
 * degan toast YOZILMAYDI — "boshlandi" deyiladi va ro'yxat holatni
 * o'zi yangilab turadi.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  AudienceSize,
  Broadcast,
  BroadcastAudience,
  BroadcastMode,
  Paginated,
} from "@/shared/api/types";

export interface BroadcastFilters {
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * ⚠️ `refetchInterval` SHARTLI: ro'yxatda hali tugamagan tarqatma
 * bo'lsa, u har 3 soniyada yangilanadi. Doimiy so'rov esa ochiq
 * turgan panelni bekorga band qilardi — tugagan tarqatma
 * o'zgarmaydi.
 */
export const useBroadcasts = (filters: BroadcastFilters) =>
  useQuery({
    queryKey: queryKeys.broadcasts.list(filters),
    queryFn: () => api.get<Paginated<Broadcast>>("/broadcasts", { ...filters }),
    placeholderData: (previous) => previous,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const busy = items.some(
        (item) => item.status === "pending" || item.status === "sending",
      );
      return busy ? 3000 : false;
    },
  });

export interface BroadcastTarget {
  audience: BroadcastAudience;
  districtId?: string;
  mahallaId?: string;
}

export interface BroadcastInput extends BroadcastTarget {
  mode: BroadcastMode;
  message?: string;
}

/**
 * AUDITORIYA HAJMI — YUBORISHDAN OLDIN.
 *
 * ⚠️ TASDIQ EKRANI UCHUN: "1 240 kishiga yuboriladi" degan son
 * hudud noto'g'ri tanlanganini TO'XTATADI. Usiz xato faqat
 * yuborilgandan KEYIN bilinardi — qaytarib bo'lmaydigan paytda.
 *
 * ⚠️ `enabled`: auditoriya tanlanmaguncha so'rov yuborilmaydi.
 */
export const useAudienceSize = (target: BroadcastTarget | null) =>
  useQuery({
    queryKey: queryKeys.broadcasts.list({ preview: target }),
    queryFn: () =>
      api.post<AudienceSize>("/broadcasts/preview", {
        ...target,
        // ⚠️ SERVER DTO'si `mode` VA MAZMUNNI TALAB QILADI (bitta
        // sinf ikkala so'rov uchun). Sanashda ular ishlatilmaydi.
        mode: "text",
        message: "preview",
      }),
    enabled: target !== null,
    staleTime: 30_000,
  });

export const useSendBroadcast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BroadcastInput) => api.post<Broadcast>("/broadcasts", input),
    onSuccess: () => {
      // ⚠️ "YUBORILDI" EMAS: tarqatma fon'da ketadi va minglab xabar
      // bir necha daqiqa davom etadi.
      toast.success("Tarqatma boshlandi — holati ro'yxatda ko'rinadi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Yuborilmadi");
    },
  });
};
