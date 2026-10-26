/**
 * YANGILIKLAR — query va mutatsiyalar (panel).
 *
 * ⚠️ FUQARO TOMONI ALOHIDA: ilova faqat NASHR ETILGAN va tumaniga mos
 * e'lonlarni ko'radi. Bu yerda xodim qoralamani ham ko'radi.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { Announcement, Paginated } from "@/shared/api/types";

export interface AnnouncementFilters {
  districtId?: string;
  publishedOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  coverPath?: string;
  isPinned?: boolean;
  districtId?: string;
  publish?: boolean;
}

export const useAnnouncements = (filters: AnnouncementFilters) =>
  useQuery({
    queryKey: queryKeys.announcements.list(filters),
    queryFn: () => api.get<Paginated<Announcement>>("/announcements", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnnouncementInput) => api.post("/announcements", input),
    onSuccess: () => {
      toast.success("Yangilik saqlandi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Saqlanmadi");
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & Partial<AnnouncementInput>) => {
      const { id, ...body } = input;
      return api.patch(`/announcements/${id}`, body);
    },
    onSuccess: () => {
      toast.success("Yangilik yangilandi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Saqlanmadi");
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      toast.success("Yangilik o'chirildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "O'chirilmadi");
    },
  });
};
