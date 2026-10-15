/**
 * TELEGRAM GURUHLARI — query va mutatsiyalar.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { GroupStats, Paginated, TelegramGroup } from "@/shared/api/types";

export interface GroupFilters {
  isOfficial?: boolean;
  mahallaId?: string;
  unassigned?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

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
