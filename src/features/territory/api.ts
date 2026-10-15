/**
 * HUDUD — tuman va MFY.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { District, Mahalla } from "@/shared/api/types";

/**
 * TUMANLAR.
 *
 * ⚠️ `staleTime` UZOQ (10 daqiqa): tumanlar ro'yxati bir marta
 * kiritiladi va deyarli o'zgarmaydi. Qisqa bo'lsa, u har filtr
 * va har oyna ochilishida so'ralardi (o'nlab joyda tanlov
 * ro'yxati sifatida ishlatiladi).
 */
export const useDistricts = (includeArchived = false) =>
  useQuery({
    queryKey: queryKeys.territory.districts({ includeArchived }),
    queryFn: () =>
      api.get<District[]>("/territory/districts", { includeArchived }),
    staleTime: 10 * 60_000,
  });

export interface MahallaFilters {
  districtId?: string;
  search?: string;
  includeArchived?: boolean;
}

export const useMahallas = (filters: MahallaFilters = {}) =>
  useQuery({
    queryKey: queryKeys.territory.mahallas(filters),
    queryFn: () => api.get<Mahalla[]>("/territory/mahallas", { ...filters }),
    staleTime: 10 * 60_000,
  });

// ═══════════════════════════════════════════════════════════════════
//  MUTATSIYALAR
// ═══════════════════════════════════════════════════════════════════

export const useSaveDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id?: string; code: string; name: string; sortOrder?: number }) => {
      const { id, ...body } = input;
      return id
        ? api.patch<District>(`/territory/districts/${id}`, body)
        : api.post<District>("/territory/districts", body);
    },
    onSuccess: (_result, input) => {
      toast.success(input.id ? "Tuman saqlandi" : "Tuman qo'shildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.territory.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Saqlanmadi");
    },
  });
};

export const useSaveMahalla = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id?: string;
      districtId: string;
      code: string;
      name: string;
      chairmanName?: string;
      chairmanPhone?: string;
      population?: number;
      sortOrder?: number;
    }) => {
      const { id, ...body } = input;
      return id
        ? api.patch<Mahalla>(`/territory/mahallas/${id}`, body)
        : api.post<Mahalla>("/territory/mahallas", body);
    },
    onSuccess: (_result, input) => {
      toast.success(input.id ? "MFY saqlandi" : "MFY qo'shildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.territory.all() });
      // ⚠️ GURUHLAR HAM: ularning kartasida MFY nomi ko'rinadi.
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Saqlanmadi");
    },
  });
};

/**
 * ARXIVLASH.
 *
 * ⚠️ O'CHIRISH EMAS: tumanga biriktirilgan MFY, guruhlar, signallar
 * va murojaatlar tarixi qoladi. Server xodimi yoki guruhi bor
 * yozuvni arxivlashni RAD ETADI va o'sha matn shu yerda
 * ko'rsatiladi ("avval xodimlarni boshqa tumanga o'tkazing").
 */
export const useArchiveTerritory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      kind: "district" | "mahalla";
      id: string;
      archived: boolean;
    }) =>
      api.patch(
        `/territory/${input.kind === "district" ? "districts" : "mahallas"}/${input.id}/archive`,
        { archived: input.archived },
      ),
    onSuccess: (_result, input) => {
      toast.success(input.archived ? "Arxivlandi" : "Arxivdan qaytarildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.territory.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};
