/**
 * IJROCHI QOIDALARI — MFY × yo'nalish → xodim.
 *
 * ⚠️ QOIDA KELAJAK UCHUN: o'zgartirilganda ALLAQACHON yaratilgan
 * murojaatlarning ijrochisi O'ZGARMAYDI (`Issue.assigneeId` — nusxa).
 * Shuning uchun saqlagandan keyin muammolar ro'yxatini bekor qilish
 * SHART EMAS — lekin keyingi murojaatlar boshqa xodimga tushadi,
 * ya'ni kalit `issues` daraxtida turadi (`query-keys.ts` izohi).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { MahallaRules } from "@/shared/api/types";

export interface RuleFilters {
  districtId?: string;
  mahallaId?: string;
}

/**
 * ⚠️ RO'YXAT MFY DAN BOSHLANADI, QOIDADAN EMAS: panel "shu MFY da
 * qaysi yo'nalish KIMSIZ qolgan" degan savolga javob berishi kerak.
 * Faqat mavjud qoidalar ko'rsatilsa, BO'SH joylar ko'rinmay qolardi —
 * aynan ular esa muammo.
 *
 * ⚠️ `enabled`: tuman tanlanmaguncha so'ralmaydi. Viloyatdagi barcha
 * MFY ni bir so'rovda olish (yuzlab yozuv × yo'nalishlar) sahifani
 * sekinlashtirardi.
 */
export const useAssignmentRules = (filters: RuleFilters, enabled = true) =>
  useQuery({
    queryKey: queryKeys.assignmentRules.list(filters),
    queryFn: () => api.get<MahallaRules[]>("/issues/assignment-rules", { ...filters }),
    enabled,
    placeholderData: (previous) => previous,
  });

export interface SaveRuleInput {
  mahallaId: string;
  categoryId: string;
  userId: string;
  slaHours?: number;
}

export const useSaveAssignmentRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveRuleInput) =>
      api.post("/issues/assignment-rules", input),
    onSuccess: () => {
      toast.success("Ijrochi biriktirildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignmentRules.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Saqlanmadi");
    },
  });
};

export const useRemoveAssignmentRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/issues/assignment-rules/${id}`),
    onSuccess: () => {
      toast.success("Qoida olib tashlandi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignmentRules.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "O'chirilmadi");
    },
  });
};
