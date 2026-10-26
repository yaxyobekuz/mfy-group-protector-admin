/**
 * FUQAROLAR — query va mutatsiyalar (panel).
 *
 * ⚠️ FUQARO — XODIM EMAS: bu yerda ruxsat/qamrov yo'q, faqat ko'rish va
 * BLOKLASH (sabab bilan). Blok — `citizens.manage`, operatorда yo'q.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { CitizenDetail, CitizenListItem, Paginated } from "@/shared/api/types";

export interface CitizenFilters {
  districtId?: string;
  blocked?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const useCitizens = (filters: CitizenFilters) =>
  useQuery({
    queryKey: queryKeys.citizens.list(filters),
    queryFn: () => api.get<Paginated<CitizenListItem>>("/citizens", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useCitizen = (id: string) =>
  useQuery({
    queryKey: queryKeys.citizens.detail(id),
    queryFn: () => api.get<CitizenDetail>(`/citizens/${id}`),
    enabled: Boolean(id),
  });

export interface BroadcastResult {
  recipients: number;
  sent: number;
  failed: number;
}

export const useBroadcast = () => {
  return useMutation({
    mutationFn: (input: { message: string; districtId?: string }) =>
      api.post<BroadcastResult>("/citizens/broadcast", input),
    onSuccess: (result) => {
      toast.success(`Xabar yuborildi: ${result.sent}/${result.recipients}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Yuborilmadi");
    },
  });
};

export const useBlockCitizen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; blocked: boolean; reason?: string }) =>
      api.patch(`/citizens/${input.id}/block`, {
        blocked: input.blocked,
        reason: input.reason,
      }),
    onSuccess: (_result, input) => {
      toast.success(input.blocked ? "Fuqaro bloklandi" : "Blok yechildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.citizens.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};
