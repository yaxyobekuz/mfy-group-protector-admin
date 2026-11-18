/**
 * TASHKILOTLAR — query va mutatsiyalar.
 *
 * ⚠️ KALITLAR `query-keys.ts` DAN (yagona manba): qo'lda yozilgan
 * kalit `invalidateQueries` bilan ajralib ketganda ro'yxat eski
 * ma'lumotni ko'rsatib turardi va foydalanuvchi "qoidani qo'ydim,
 * lekin jadvalda yo'q" deb hayron bo'lardi.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  OrgLoginResult,
  OrgRoutesResponse,
  OrgUser,
  Organization,
} from "@/shared/api/types";

export interface OrganizationFilters {
  districtId?: string;
  search?: string;
  includeArchived?: boolean;
}

export const useOrganizations = (filters: OrganizationFilters = {}) =>
  useQuery({
    queryKey: queryKeys.organizations.list(filters),
    queryFn: () => api.get<Organization[]>("/organizations", { ...filters }),
  });

/**
 * ⚠️ `staleTime` UZOQ: qoidalar — SOZLAMA, ro'yxat emas. Ular oyda
 * bir marta o'zgaradi va har sahifa ochilishida qayta tortish
 * keraksiz yuk bo'lardi (`useActiveCategories` bilan ayni qoida).
 */
export const useOrgRoutes = (params: { districtId?: string } = {}) =>
  useQuery({
    queryKey: queryKeys.organizations.routes(params),
    queryFn: () => api.get<OrgRoutesResponse>("/organizations/routes", { ...params }),
    staleTime: 60_000,
  });

export const useOrgUsers = (id: string) =>
  useQuery({
    queryKey: queryKeys.organizations.users(id),
    queryFn: () => api.get<OrgUser[]>(`/organizations/${id}/users`),
    enabled: Boolean(id),
  });

// ═══════════════════════════════════════════════════════════════════
//  MUTATSIYALAR
// ═══════════════════════════════════════════════════════════════════

/**
 * ⚠️ HAMMA MUTATSIYA `organizations.all()` NI BEKOR QILADI: qoida
 * saqlanganda tashkilotlar ro'yxatidagi `routeCount` ham o'zgaradi,
 * hisob yaratilganda `userCount` ham. Faqat o'z kalitini bekor
 * qilsak, yondagi son eskirib turardi.
 */
const useOrgMutation = <TInput, TResult>(
  fn: (input: TInput) => Promise<TResult>,
  successText: string | ((input: TInput) => string),
  failText: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: (_result, input) => {
      toast.success(typeof successText === "function" ? successText(input) : successText);
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : failText);
    },
  });
};

export const useCreateOrganization = () =>
  useOrgMutation(
    (input: {
      name: string;
      shortName?: string;
      districtId?: string;
      phone?: string;
      address?: string;
    }) => api.post<{ id: string; name: string }>("/organizations", input),
    "Tashkilot qo'shildi",
    "Tashkilot qo'shilmadi",
  );

export const useUpdateOrganization = () =>
  useOrgMutation(
    (input: {
      id: string;
      name?: string;
      shortName?: string | null;
      districtId?: string | null;
      phone?: string | null;
      address?: string | null;
      isActive?: boolean;
    }) => {
      const { id, ...rest } = input;
      return api.patch(`/organizations/${id}`, rest);
    },
    "Saqlandi",
    "Saqlanmadi",
  );

export const useArchiveOrganization = () =>
  useOrgMutation(
    (input: { id: string; archived: boolean }) =>
      api.patch(`/organizations/${input.id}/archive`, { archived: input.archived }),
    (input) => (input.archived ? "Tashkilot arxivlandi" : "Tashkilot qaytarildi"),
    "Amal bajarilmadi",
  );

export const useSaveOrgRoute = () =>
  useOrgMutation(
    (input: { organizationId: string; categoryId: string; districtId?: string }) =>
      api.post("/organizations/routes", input),
    "Yo'naltirish qoidasi saqlandi",
    "Qoida saqlanmadi",
  );

export const useRemoveOrgRoute = () =>
  useOrgMutation(
    (id: string) => api.delete(`/organizations/routes/${id}`),
    "Qoida olib tashlandi",
    "Amal bajarilmadi",
  );

/**
 * HISOB YARATADI — PAROL JAVOBDA BIR MARTA.
 *
 * ⚠️ `toast` DA PAROL KO'RSATILMAYDI: xabar bir necha soniyada
 * yo'qoladi va admin uni ko'chirib olishga ulgurmasdi. Parol
 * sahifada ALOHIDA, nusxa olish tugmasi bilan ko'rsatiladi.
 */
export const useCreateOrgLogin = () =>
  useOrgMutation(
    (input: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string;
      username?: string;
    }) => {
      const { id, ...rest } = input;
      return api.post<OrgLoginResult>(`/organizations/${id}/users`, rest);
    },
    "Hisob yaratildi",
    "Hisob yaratilmadi",
  );

export const useResetOrgLogin = () =>
  useOrgMutation(
    (input: { id: string; userId: string }) =>
      api.post<{ username: string; password: string }>(
        `/organizations/${input.id}/users/${input.userId}/reset`,
      ),
    "Yangi parol yasaldi",
    "Parol tiklanmadi",
  );

export const useOrgLinkCode = () =>
  useOrgMutation(
    (id: string) => api.post<{ linkCode: string }>(`/organizations/${id}/link-code`),
    "Ulanish kodi yasaldi",
    "Kod yasalmadi",
  );
