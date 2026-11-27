/**
 * TARQATMA — QUERY VA MUTATSIYALAR.
 *
 * ⚠️ AUDITORIYA HAJMI ALOHIDA SO'ROV (`preview`): u har tanlov
 * o'zgarganda qayta so'raladi va "1 240 kishiga yuboriladi" degan
 * son hudud noto'g'ri tanlanganini TO'XTATADI. Usiz xato faqat
 * yuborilgandan keyin bilinardi — qaytarib bo'lmaydigan paytda.
 *
 * ⚠️ RO'YXAT ISHLAYOTGAN TARQATMA BORIDA O'ZI YANGILANADI: aks
 * holda operator "yuborildi" degan sonni ko'rish uchun sahifani
 * qo'lda yangilab turardi.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  AudienceSize,
  Broadcast,
  BroadcastAudience,
  BroadcastButton,
  BroadcastDelivery,
  BroadcastMode,
  BroadcastParseMode,
  BroadcastRecipient,
  Paginated,
} from "@/shared/api/types";

export interface BroadcastFilters {
  status?: string;
  audience?: string;
  page?: number;
  limit?: number;
}

export const useBroadcasts = (filters: BroadcastFilters) =>
  useQuery({
    queryKey: queryKeys.broadcasts.list(filters),
    queryFn: () => api.get<Paginated<Broadcast>>("/broadcasts", { ...filters }),
    placeholderData: (previous) => previous,
    /**
     * ⚠️ `scheduled` HAM KUZATILADI: rejalashtirilgan tarqatma
     * vaqti kelganda job uni boshlaydi va panel buni o'zi
     * ko'rsatishi kerak — operator sahifani ochiq qoldirgan
     * bo'lishi mumkin.
     */
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const busy = items.some(
        (item) =>
          item.status === "pending" ||
          item.status === "sending" ||
          item.status === "scheduled",
      );
      return busy ? 3000 : false;
    },
  });

export interface BroadcastTarget {
  audience: BroadcastAudience;
  districtId?: string;
  mahallaId?: string;
  activeDays?: number;
  chatIds?: string[];
}

export interface BroadcastInput extends BroadcastTarget {
  mode: BroadcastMode;
  title?: string;
  message?: string;
  fromChatId?: string;
  sourceMessageId?: string;
  parseMode?: BroadcastParseMode;
  disablePreview?: boolean;
  silent?: boolean;
  pinMessage?: boolean;
  buttons?: BroadcastButton[];
  scheduledAt?: string;
}

export const useAudienceSize = (target: BroadcastTarget | null) =>
  useQuery({
    queryKey: queryKeys.broadcasts.list({ preview: target }),
    queryFn: () => api.post<AudienceSize>("/broadcasts/preview", { ...target }),
    enabled: target !== null,
    staleTime: 30_000,
  });

export const useBroadcastRecipients = (
  id: string | null,
  status: BroadcastDelivery | undefined,
) =>
  useQuery({
    queryKey: queryKeys.broadcasts.list({ recipients: id, status }),
    queryFn: () =>
      api.get<Paginated<BroadcastRecipient>>(`/broadcasts/${id}/recipients`, {
        ...(status ? { status } : {}),
        limit: 100,
      }),
    enabled: Boolean(id),
  });

export const useSendBroadcast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BroadcastInput) => api.post<Broadcast>("/broadcasts", input),
    onSuccess: (broadcast) => {
      toast.success(
        broadcast.scheduledAt
          ? "Tarqatma rejalashtirildi"
          : "Tarqatma boshlandi — holati ro'yxatda ko'rinadi",
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Yuborilmadi");
    },
  });
};

/**
 * SINOV XABARI — FAQAT O'ZIGA.
 *
 * ⚠️ RO'YXAT YANGILANMAYDI: sinov tarqatma emas va tarixga
 * tushmaydi (serverda ham yozuv yaratilmaydi).
 */
export const useTestBroadcast = () =>
  useMutation({
    mutationFn: (input: BroadcastInput) => api.post<{ ok: true }>("/broadcasts/test", input),
    onSuccess: () => toast.success("Sinov xabari Telegram'ga yuborildi"),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Sinov yuborilmadi");
    },
  });

export const useCancelBroadcast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ id: string; stopping: boolean }>(`/broadcasts/${id}/cancel`, {}),
    onSuccess: (result) => {
      toast.success(
        result.stopping
          ? "To'xtatilmoqda — yuborilganlarni qaytarib bo'lmaydi"
          : "Tarqatma bekor qilindi",
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "To'xtatilmadi");
    },
  });
};

export const useRetryBroadcast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ id: string; targets: number }>(`/broadcasts/${id}/retry`, {}),
    onSuccess: (result) => {
      toast.success(`${result.targets} ta manzilga qayta yuborilmoqda`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Qayta yuborilmadi");
    },
  });
};
