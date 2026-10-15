/**
 * SIGNALLAR — query va mutatsiyalar.
 *
 * ⚠️ HAR MUTATSIYA KEYIN NIMANI BEKOR QILISHINI O'ZI BILADI. Bu
 * chaqiruvchi komponentga qoldirilmaydi: signalni biriktirish
 * signallar ro'yxatiga, sanoqlarga VA murojaatlar ro'yxatiga ta'sir
 * qiladi — uchinchisini unutish eng oson va natijasi "muammo
 * yaratildi, lekin ro'yxatda yo'q" bo'lardi.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  AnalysisSummary,
  IssuePriority,
  Paginated,
  Signal,
  SignalCounts,
  SignalJobStatus,
  SignalKind,
  SignalSeverity,
  SignalStatus,
} from "@/shared/api/types";

export interface SignalFilters {
  status?: SignalStatus;
  kind?: SignalKind;
  severity?: SignalSeverity;
  mahallaId?: string;
  chatId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const useSignals = (filters: SignalFilters) =>
  useQuery({
    queryKey: queryKeys.signals.list(filters),
    queryFn: () => api.get<Paginated<Signal>>("/signals", { ...filters }),
    /**
     * ⚠️ `placeholderData` SAQLANADI: filtr yoki sahifa
     * o'zgarganda ro'yxat BO'SHAB KETMAYDI, eski ma'lumot
     * ko'rinib turadi. Usiz har filtr o'zgarishida jadval
     * "sakrab", skelet ko'rinardi.
     */
    placeholderData: (previous) => previous,
  });

export const useSignalCounts = () =>
  useQuery({
    queryKey: queryKeys.signals.counts(),
    queryFn: () => api.get<SignalCounts>("/signals/counts"),
  });

export const useSignalStatus = () =>
  useQuery({
    queryKey: queryKeys.signals.status(),
    queryFn: () => api.get<SignalJobStatus>("/signals/status"),
    /**
     * ⚠️ TAHLIL KETAYOTGANDA TEZROQ SO'RALADI: operator "Hozir
     * tekshirish" bosgandan keyin natijani kutib turadi va
     * 30 sekundlik kesh bilan u tugaganini bilmay qolardi.
     */
    refetchInterval: (query) =>
      query.state.data?.isRunning ? 3_000 : false,
  });

/**
 * TAHLILNI QO'LDA ISHGA TUSHIRADI.
 *
 * ⚠️ HAR BOSISHDA AI SO'ROVI KETADI, ya'ni PUL sarflanadi. Shuning
 * uchun serverda alohida ruxsat (`signals.run`) va bu yerda —
 * natijani ANIQ aytadigan xabar: "0 xabar ko'rildi" ham javob va
 * uni jim o'tkazib yuborish operatorni yana bosishga majbur
 * qilardi.
 */
export const useRunAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<AnalysisSummary>("/signals/run"),
    onSuccess: (result) => {
      if (result.skipped) {
        toast.warning("AI tahlili o'chirilgan", {
          description: "Sozlamalarda yoqing yoki serverda OPENAI_API_KEY ni qo'ying.",
        });
        return;
      }

      if (result.analyzed === 0) {
        toast.info("Yangi xabar yo'q", {
          description: "Navbatda tahlil qilinmagan xabar topilmadi.",
        });
      } else {
        toast.success(
          `${result.analyzed} xabar ko'rildi — ${result.signals} signal`,
          {
            // ⚠️ YIQILGAN GURUHLAR AYTILADI: "topilmadi" va
            // "tekshirib bo'lmadi" — BOSHQA narsa. Jim
            // o'tkazilsa, operator "guruhda gap yo'q" deb
            // o'ylardi.
            description:
              result.failedGroups > 0
                ? `${result.failedGroups} guruh tekshirilmadi — keyingi aylanishda qayta ko'riladi`
                : result.pending > 0
                  ? `Navbatda yana ${result.pending} xabar bor`
                  : undefined,
          },
        );
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Tahlil ishga tushmadi");
    },
  });
};

/**
 * SIGNALNI MUAMMOGA BIRIKTIRADI.
 *
 * ⚠️ MUROJAATLAR RO'YXATI HAM BEKOR QILINADI: yangi muammo
 * yaratildi va u o'sha ro'yxatda ko'rinishi kerak. Faqat
 * signallarni bekor qilish "biriktirdim, lekin murojaatlar
 * ro'yxatida yo'q" degan holatni berardi.
 */
export const useAttachSignal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: string;
      categoryId: string;
      title?: string;
      priority?: IssuePriority;
    }) =>
      api.patch<{ signalId: string; issueId: string; publicNo: string }>(
        `/signals/${input.id}/attach`,
        { categoryId: input.categoryId, title: input.title, priority: input.priority },
      ),
    onSuccess: (result) => {
      toast.success("Murojaat yaratildi", { description: result.publicNo });

      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Biriktirib bo'lmadi",
      );
    },
  });
};

export const useDismissSignal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; reason?: string }) =>
      api.patch<{ id: string }>(`/signals/${input.id}/dismiss`, {
        reason: input.reason,
      }),
    onSuccess: () => {
      toast.success("Signal e'tiborsiz qoldirildi");
      void queryClient.invalidateQueries({ queryKey: queryKeys.signals.all() });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Amal bajarilmadi");
    },
  });
};
