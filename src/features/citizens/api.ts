import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  Citizen,
  CitizenDetail,
  CitizenStats,
  Paginated,
} from "@/shared/api/types";

export interface CitizenFilters {
  districtId?: string;
  blocked?: boolean;
  search?: string;
  sort?: "recent" | "points";
  page?: number;
  limit?: number;
}

export const useCitizens = (filters: CitizenFilters) =>
  useQuery({
    queryKey: queryKeys.citizens.list(filters),
    queryFn: () => api.get<Paginated<Citizen>>("/citizens", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useCitizen = (id: string | null) =>
  useQuery({
    queryKey: queryKeys.citizens.detail(id ?? ""),
    queryFn: () => api.get<CitizenDetail>(`/citizens/${id}`),
    enabled: Boolean(id),
  });

export const useCitizenStats = () =>
  useQuery({
    queryKey: queryKeys.citizens.stats(),
    queryFn: () => api.get<CitizenStats>("/citizens/stats"),
  });

/**
 * CHEKLAYDI.
 *
 * ⚠️ SABAB MAJBURIY va u FUQAROGA ILOVADA ko'rsatiladi
 * (`jwt-auth.guard.ts#checkCitizen`). Operator buni bilishi kerak —
 * shuning uchun xabar matnida ham aytiladi.
 */
export const useBlockCitizen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; reason: string }) =>
      api.patch(`/citizens/${input.id}/block`, { reason: input.reason }),

    onSuccess: () => {
      toast.success("Hisob cheklandi", {
        description: "Sabab fuqaroga ilovada ko'rsatiladi",
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.citizens.all() });
    },

    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};

export const useUnblockCitizen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.patch(`/citizens/${id}/unblock`),

    onSuccess: () => {
      toast.success("Cheklov olib tashlandi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.citizens.all() });
    },

    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};
