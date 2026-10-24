import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api, API_URL, tokens } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { Announcement, Paginated } from "@/shared/api/types";

export interface AnnouncementFilters {
  districtId?: string;
  published?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const useAnnouncements = (filters: AnnouncementFilters) =>
  useQuery({
    queryKey: queryKeys.announcements.list(filters),
    queryFn: () => api.get<Paginated<Announcement>>("/announcements", { ...filters }),
    placeholderData: (previous) => previous,
  });

export interface SaveAnnouncementInput {
  id?: string;
  title: string;
  body: string;
  districtId?: string | null;
  coverKey?: string | null;
  isPinned?: boolean;
}

export const useSaveAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveAnnouncementInput) => {
      const { id, ...body } = input;
      return id
        ? api.patch(`/announcements/${id}`, body)
        : api.post("/announcements", body);
    },

    onSuccess: (_result, input) => {
      // ⚠️ "SAQLANDI", "E'LON QILINDI" EMAS: saqlash e'lon
      // qilmaydi (`announcements.service.ts` qoidasi) va matn buni
      // aniq aytishi kerak — aks holda operator e'lon chiqdi deb
      // o'ylab yurardi.
      toast.success(input.id ? "Saqlandi" : "Qoralama yaratildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() });
    },

    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Saqlanmadi");
    },
  });
};

export const usePublishAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; publish: boolean }) =>
      api.patch(
        `/announcements/${input.id}/${input.publish ? "publish" : "unpublish"}`,
      ),

    onSuccess: (_result, input) => {
      toast.success(
        input.publish
          ? "E'lon qilindi — ilovada ko'rinadi"
          : "Qoralamaga qaytarildi",
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() });
    },

    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),

    onSuccess: () => {
      toast.success("O'chirildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() });
    },

    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "O'chirilmadi");
    },
  });
};

/**
 * MUQOVA RASMI.
 *
 * ⚠️ `api` MIJOZI ORQALI EMAS, TO'G'RIDAN-TO'G'RI `fetch`: u har
 * so'rovga `Content-Type: application/json` qo'yadi va
 * `FormData` da bu sarlavha `boundary` ni buzib, server faylni
 * umuman ko'rmasdi.
 *
 * ⚠️ 401 DA QAYTA URINISH YO'Q (mijozdagidan farqli): muqova
 * yuklash — kamdan-kam amal va token eskirgan bo'lsa operator
 * tugmani qaytadan bosadi. Refresh mantig'ini bu yerda
 * takrorlash uni ikki joyda saqlashga olib kelardi.
 */
export const useUploadCover = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);

      const token = tokens.access();

      const response = await fetch(`${API_URL}/announcements/cover`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      const text = await response.text();
      const payload = text ? (JSON.parse(text) as unknown) : null;

      if (!response.ok) {
        const error = payload as { message?: string } | null;
        throw new ApiError(response.status, error?.message ?? "Yuklanmadi");
      }

      return payload as { coverKey: string; url: string };
    },

    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Rasm yuklanmadi");
    },
  });
