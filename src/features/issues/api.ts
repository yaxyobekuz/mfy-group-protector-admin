/**
 * MUROJAATLAR — query va mutatsiyalar.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  IssueCategory,
  IssueDetail,
  IssueListItem,
  IssuePriority,
  IssueSource,
  IssueStats,
  IssueStatus,
  Paginated,
} from "@/shared/api/types";

export interface IssueFilters {
  status?: IssueStatus;
  priority?: IssuePriority;
  source?: IssueSource;
  categoryId?: string;
  districtId?: string;
  mahallaId?: string;
  assigneeId?: string;
  overdue?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const useIssues = (filters: IssueFilters) =>
  useQuery({
    queryKey: queryKeys.issues.list(filters),
    queryFn: () => api.get<Paginated<IssueListItem>>("/issues", { ...filters }),
    placeholderData: (previous) => previous,
  });

export const useIssue = (id: string) =>
  useQuery({
    queryKey: queryKeys.issues.detail(id),
    queryFn: () => api.get<IssueDetail>(`/issues/${id}`),
    enabled: Boolean(id),
  });

export const useIssueStats = () =>
  useQuery({
    queryKey: queryKeys.issues.stats(),
    queryFn: () => api.get<IssueStats>("/issues/stats"),
  });

/**
 * KATEGORIYALAR.
 *
 * ⚠️ `staleTime` UZOQ (5 daqiqa): bu sozlama, ro'yxat emas — kunda
 * bir marta o'zgaradi. Qisqa bo'lsa, har oyna ochilishida so'rov
 * ketardi (signalni biriktirish oynasi buni chaqiradi).
 */
export const useActiveCategories = () =>
  useQuery({
    queryKey: queryKeys.issues.categories(true),
    queryFn: () => api.get<IssueCategory[]>("/issue-categories", { activeOnly: true }),
    staleTime: 5 * 60_000,
  });

export const useAllCategories = () =>
  useQuery({
    queryKey: queryKeys.issues.categories(false),
    queryFn: () => api.get<IssueCategory[]>("/issue-categories"),
    staleTime: 5 * 60_000,
  });

// ═══════════════════════════════════════════════════════════════════
//  MUTATSIYALAR
// ═══════════════════════════════════════════════════════════════════

export const useAssignIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; assigneeId: string | null; dueAt?: string | null }) =>
      api.patch(`/issues/${input.id}/assign`, {
        assigneeId: input.assigneeId,
        dueAt: input.dueAt,
      }),
    onSuccess: (_result, input) => {
      toast.success(input.assigneeId ? "Ijrochi belgilandi" : "Ijrochi olib tashlandi");

      // ⚠️ IKKITASI BEKOR QILINADI: ro'yxat (holat `in_progress`
      // ga o'tgan bo'lishi mumkin) va KARTA. Faqat ro'yxatni
      // bekor qilsak, ochiq karta eski ijrochini ko'rsatib
      // turardi.
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};

/**
 * MUROJAATNI YOPADI.
 *
 * ⚠️ `resolution` MATNI BOTDAGI MUALLIFGA ketadi (botdan kelgan
 * murojaatda). Shuning uchun u serverda MAJBURIY va kamida
 * 10 belgi — "ok" deb yopilsa, odam mazmunsiz javob olardi.
 */
export const useResolveIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; resolution: string; rejected?: boolean }) =>
      api.patch(`/issues/${input.id}/resolve`, {
        resolution: input.resolution,
        rejected: input.rejected,
      }),
    onSuccess: (_result, input) => {
      toast.success(input.rejected ? "Murojaat rad etildi" : "Murojaat hal qilindi");

      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() });
      // ⚠️ SIGNALLAR HAM: biriktirilgan signal kartasida
      // murojaatning HOLATI ko'rinadi va u eskirmasligi kerak.
      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Yopib bo'lmadi");
    },
  });
};

export const useReopenIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.patch(`/issues/${id}/reopen`),
    onSuccess: () => {
      toast.success("Murojaat qayta ochildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; body: string; isPublic?: boolean }) =>
      api.post(`/issues/${input.id}/comments`, {
        body: input.body,
        isPublic: input.isPublic,
      }),
    onSuccess: (_result, input) => {
      // ⚠️ OMMAVIY IZOH MUALLIFGA KETGANINI AYTADI: operator buni
      // bilishi kerak, aks holda ichki muhokamani ommaviy deb
      // belgilab yuborishi mumkin.
      toast.success(
        input.isPublic ? "Izoh qo'shildi va muallifga yuborildi" : "Izoh qo'shildi",
      );

      void queryClient.invalidateQueries({
        queryKey: queryKeys.issues.detail(input.id),
      });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Izoh qo'shilmadi");
    },
  });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      categoryId: string;
      mahallaId?: string;
      title: string;
      body: string;
      priority?: IssuePriority;
      dueAt?: string;
    }) => api.post<{ id: string; publicNo: string }>("/issues", input),
    onSuccess: (result) => {
      toast.success("Murojaat yaratildi", { description: result.publicNo });
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Yaratib bo'lmadi");
    },
  });
};

// ── KATEGORIYALAR ──────────────────────────────────────────────────

export const useSaveCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id?: string;
      name: string;
      color?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => {
      const { id, ...body } = input;
      return id
        ? api.patch<IssueCategory>(`/issue-categories/${id}`, body)
        : api.post<IssueCategory>("/issue-categories", body);
    },
    onSuccess: (_result, input) => {
      toast.success(input.id ? "Yo'nalish saqlandi" : "Yo'nalish qo'shildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Saqlanmadi");
    },
  });
};

/**
 * ⚠️ QATTIQ O'CHIRISH EMAS — `isActive: false`. Server oxirgi FAOL
 * kategoriyani o'chirishni ham rad etadi (botdagi oqim ishlamay
 * qolardi) va o'sha matn shu yerda ko'rsatiladi.
 */
export const useDeactivateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/issue-categories/${id}`),
    onSuccess: () => {
      toast.success("Yo'nalish o'chirildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "O'chirib bo'lmadi");
    },
  });
};
