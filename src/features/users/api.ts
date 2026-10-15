/**
 * XODIMLAR — ruxsat va hududiy qamrov.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  Paginated,
  PermissionCatalog,
  ScopeKind,
  StaffUser,
  UserRole,
} from "@/shared/api/types";

export interface UserFilters {
  role?: UserRole;
  districtId?: string;
  search?: string;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

export const useUsers = (filters: UserFilters) =>
  useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => api.get<Paginated<StaffUser>>("/users", { ...filters }),
    placeholderData: (previous) => previous,
  });

/**
 * RUXSAT KATALOGI — forma shundan quriladi.
 *
 * ⚠️ SERVERDAN KELADI, panelda nusxa YO'Q. Katalogni ikki joyda
 * saqlash qo'lda sinxronni talab qilardi va u albatta eskirardi:
 * panelda tugma ko'rinib, server 403 qaytarardi (yoki teskarisi,
 * bu xavfliroq).
 *
 * ⚠️ `staleTime: Infinity`: katalog KOD bilan birga keladi, ya'ni
 * deploy'gacha o'zgarmaydi.
 */
export const usePermissionCatalog = () =>
  useQuery({
    queryKey: queryKeys.users.catalog(),
    queryFn: () => api.get<PermissionCatalog>("/users/permissions-catalog"),
    staleTime: Infinity,
  });

export const useSaveUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id?: string;
      username?: string;
      password?: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: UserRole;
      scopeKind: ScopeKind;
      districtId?: string | null;
      permissions?: string[];
      telegramId?: string | null;
      isActive?: boolean;
    }) => {
      const { id, ...body } = input;

      if (id) {
        // ⚠️ TAHRIRLASHDA `username` VA `password` YUBORILMAYDI:
        // server DTO'sida ular yo'q va `forbidNonWhitelisted`
        // tufayli so'rov RAD ETILARDI. Parol alohida endpoint
        // orqali (`useResetPassword`).
        const { username, password, ...rest } = body;
        return api.patch<StaffUser>(`/users/${id}`, rest);
      }

      return api.post<StaffUser>("/users", body);
    },
    onSuccess: (_result, input) => {
      toast.success(input.id ? "Xodim saqlandi" : "Xodim qo'shildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Saqlanmadi");
    },
  });
};

/**
 * ARXIVLASH.
 *
 * ⚠️ BARCHA SESSIYALAR YOPILADI (serverda) — arxivlangan xodim
 * tizimga kira olmasligi kerak va buni token muddati tugashini
 * kutib bo'lmaydi. Xabar matni shuni aytadi.
 */
export const useArchiveUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; archived: boolean }) =>
      api.patch(`/users/${input.id}/archive`, { archived: input.archived }),
    onSuccess: (_result, input) => {
      toast.success(
        input.archived ? "Xodim arxivlandi" : "Xodim arxivdan qaytarildi",
        {
          description: input.archived
            ? "Barcha sessiyalari yopildi — tizimga kira olmaydi."
            : undefined,
        },
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};

/**
 * PAROLNI TIKLAYDI.
 *
 * ⚠️ SESSIYALAR YOPILADI (serverda): parol almashtirishning sababi
 * ko'pincha "parol tarqalgan" bo'ladi va eski sessiyalarni tirik
 * qoldirish amalni MA'NOSIZ qilardi.
 */
export const useResetPassword = () =>
  useMutation({
    mutationFn: (input: { id: string; password: string }) =>
      api.patch(`/users/${input.id}/password`, { password: input.password }),
    onSuccess: () => {
      toast.success("Parol almashtirildi", {
        description: "Xodimning barcha sessiyalari yopildi.",
      });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
