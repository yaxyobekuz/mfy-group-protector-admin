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
  /** ⚠️ Faqat kutayotganlar — "men ertalabga qo'ygan e'lon qoldimi". */
  scheduledOnly?: boolean;
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
  /**
   * ⚠️ IMZOLANGAN TOKENLAR, fayl yo'li emas: `POST
   * /announcements/uploads` javobidagi `token` shu yerga tushadi.
   * Mijoz aytgan yo'lga ishonilsa, u diskdagi istalgan faylni
   * e'longa biriktirib, uni butun aholiga ko'rsata olardi.
   */
  media?: string[];
  /** ISO sana — kelajakda. ⚠️ `publish` BILAN BIRGA BERILMAYDI. */
  scheduledAt?: string;
  /**
   * ⚠️ REJANI BEKOR QILISH — ALOHIDA BAYROQ: `scheduledAt:
   * undefined` "tegilmadi" degan ma'noni beradi va sarlavhani
   * tahrirlagan xodim rejani bilmasdan o'chirib yuborardi.
   */
  cancelSchedule?: boolean;
  /**
   * O'CHIRILADIGAN MEDIA — ID BO'YICHA.
   *
   * ⚠️ `media` BILAN BIR XIL RO'YXAT EMAS: yangilari TOKEN
   * bilan QO'SHILADI, o'chiriladiganlari ID bilan OLIB
   * TASHLANADI. Mavjud fayllarda token yo'q (imzo faqat
   * yuklash paytida beriladi), ya'ni "to'liq ro'yxat"
   * ma'nosini berib bo'lmaydi.
   */
  removeMedia?: string[];
}

/**
 * E'LON UCHUN FAYL YUKLASH.
 *
 * ⚠️ FUQARO ENDPOINT'IDAN ALOHIDA (`/mobile/uploads`): u
 * `@CitizenOnly()` bilan himoyalangan va xodim tokeni bilan umuman
 * ishlamaydi.
 *
 * ⚠️ `useMutation` EMAS, ODDIY FUNKSIYA: bir nechta fayl ketma-ket
 * yuklanadi va har biri uchun alohida mutatsiya holati kerak emas —
 * oyna o'z holatini o'zi yuritadi.
 */
export const uploadAnnouncementFile = async (
  file: File,
): Promise<{ token: string; kind: "photo" | "video"; url: string }> => {
  const form = new FormData();
  form.append("file", file);

  return api.upload<{ token: string; kind: "photo" | "video"; url: string }>(
    "/announcements/uploads",
    form,
  );
};

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
