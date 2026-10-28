"use client";

/**
 * SIGNALLAR SAHIFASI — operatorning asosiy ish joyi.
 *
 * ⚠️ SAHIFANING BUTUN MA'NOSI BIR GAPDA: "AI nima topdi va bu
 * haqiqatan muammomi". Shuning uchun sarlavhadagi izoh signalning
 * MUAMMO EMASLIGINI aytadi — operator uni rasmiy navbat deb o'ylab
 * qolmasligi kerak.
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Radio } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAttachSignal,
  useDismissSignal,
  useRunAnalysis,
  useSignalCounts,
  useSignalStatus,
  useSignals,
  type SignalFilters,
} from "@/features/signals/api";
import { AttachSignalDialog } from "@/features/signals/attach-dialog";
import { SignalCard } from "@/features/signals/signal-card";
import { useMahallas } from "@/features/territory/api";
import { ApiError } from "@/shared/api/client";
import type { Signal, SignalKind, SignalSeverity, SignalStatus } from "@/shared/api/types";
import { SIGNAL_KIND, SIGNAL_SEVERITY, SIGNAL_STATUS } from "@/shared/config/labels";
import { formatRelativeUz } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CardSkeleton, EmptyState, ErrorState, Spinner } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

/** "Hammasi" variantining qiymati — `undefined` ni Select qabul qilmaydi. */
const ALL = "__all__";

export default function SignalsPage() {
  const { can } = useSession();

  // ⚠️ TUMANLAR XARITASIDAN O'TISH: `?districtId=...` havolasi
  // o'qilmasa, bosilgan tuman o'rniga butun ro'yxat ochilardi.
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SignalFilters>(() => ({
    // ⚠️ STANDART HOLDA FAQAT `new`: e'tiborsiz qoldirilganlar
    // o'chirilmaydi (AI xatosini ko'rish uchun), lekin ular ishga
    // xalaqit bermasligi kerak.
    status: "new",
    districtId: searchParams.get("districtId") ?? undefined,
    page: 1,
    limit: 25,
  }));

  const [attachTarget, setAttachTarget] = useState<Signal | null>(null);

  const signals = useSignals(filters);
  const counts = useSignalCounts();
  const status = useSignalStatus();
  const mahallas = useMahallas();

  const runAnalysis = useRunAnalysis();
  const attach = useAttachSignal();
  const dismiss = useDismissSignal();

  /** Filtrni o'zgartirganda sahifa BIRINCHIGA qaytadi. */
  const patch = (next: Partial<SignalFilters>) =>
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));

  const handleDismiss = (signal: Signal) => {
    /**
     * ⚠️ SABAB SO'RALADI, lekin MAJBURIY EMAS (`prompt` bekor
     * qilinsa `null` qaytadi va amal TO'XTAYDI). Aynan bu matnlardan
     * "AI nimani noto'g'ri topdi" degan savolga javob chiqadi va
     * prompt shunga qarab tuzatiladi.
     *
     * `prompt` — oddiy yechim, lekin bu amal kuniga o'nlab marta
     * bajariladi va alohida oyna oqimni sekinlashtirardi.
     */
    const reason = window.prompt(
      "Nima uchun bu muammo emas? (ixtiyoriy, lekin AI ni yaxshilashga yordam beradi)",
      "",
    );

    // Bekor qilindi — hech narsa qilinmaydi.
    if (reason === null) return;

    dismiss.mutate({ id: signal.id, reason: reason.trim() || undefined });
  };

  const jobStatus = status.data;

  return (
    <>
      <PageHeader
        title="Signallar"
        actions={
          can("signals.run") ? (
            <Button
              variant="outline"
              onClick={() => runAnalysis.mutate()}
              disabled={runAnalysis.isPending || jobStatus?.isRunning}
            >
              {runAnalysis.isPending || jobStatus?.isRunning ? (
                <Spinner />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Hozir tekshirish
            </Button>
          ) : null
        }
      />

      {/* ── Holat satri ──────────────────────────────────────── */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Yangi"
          value={counts.data?.new ?? "—"}
          icon={Radio}
          tone={counts.data?.new ? "warning" : "default"}
        />
        <StatTile
          label="Yuqori jiddiylik"
          value={counts.data?.highNew ?? "—"}
          tone={counts.data?.highNew ? "danger" : "default"}
          hint="Yangilar orasida"
        />
        <StatTile
          label="Murojaatga aylangan"
          value={counts.data?.attached ?? "—"}
          tone="success"
        />
        <StatTile
          label="E'tiborsiz qoldirilgan"
          value={counts.data?.dismissed ?? "—"}
        />
      </div>

      {/*
        ⚠️ AI O'CHIRILGANI ALOHIDA AYTILADI: bo'sh ro'yxatni ko'rgan
        operator "guruhlarda gap yo'q" deb o'ylardi — aslida tahlil
        umuman ishlamayapti.
      */}
      {jobStatus && !jobStatus.aiEnabled ? (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          <p className="font-medium">AI tahlili ishlamayapti</p>
          <p className="text-muted-foreground">
            Guruh xabarlari to&apos;planib turadi, lekin tahlil qilinmaydi.
            Serverda <code className="text-xs">OPENAI_API_KEY</code> qo&apos;yilmagan
            yoki sozlamalarda o&apos;chirilgan.
          </p>
        </div>
      ) : null}

      {jobStatus?.lastRunAt ? (
        <p className="mb-4 text-xs text-muted-foreground">
          Oxirgi tekshiruv: {formatRelativeUz(jobStatus.lastRunAt)} · model{" "}
          <code className="text-xs">{jobStatus.model}</code>
          {jobStatus.lastResult && jobStatus.lastResult.pending > 0
            ? ` · navbatda ${jobStatus.lastResult.pending} xabar`
            : null}
        </p>
      ) : null}

      {/* ── Filtrlar ─────────────────────────────────────────── */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          placeholder="Matn bo'yicha izlash..."
          value={filters.search ?? ""}
          onChange={(event) => patch({ search: event.target.value || undefined })}
        />

        <Select
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            patch({ status: value === ALL ? undefined : (value as SignalStatus) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha holatlar</SelectItem>
            {Object.entries(SIGNAL_STATUS).map(([value, def]) => (
              <SelectItem key={value} value={value}>
                {def.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.kind ?? ALL}
          onValueChange={(value) =>
            patch({ kind: value === ALL ? undefined : (value as SignalKind) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha turlar</SelectItem>
            {Object.entries(SIGNAL_KIND).map(([value, def]) => (
              <SelectItem key={value} value={value}>
                {def.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.severity ?? ALL}
          onValueChange={(value) =>
            patch({ severity: value === ALL ? undefined : (value as SignalSeverity) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Jiddiylik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha darajalar</SelectItem>
            {Object.entries(SIGNAL_SEVERITY).map(([value, def]) => (
              <SelectItem key={value} value={value}>
                {def.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.mahallaId ?? ALL}
          onValueChange={(value) =>
            patch({ mahallaId: value === ALL ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="MFY" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha MFY</SelectItem>
            {mahallas.data?.map((mahalla) => (
              <SelectItem key={mahalla.id} value={mahalla.id}>
                {mahalla.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Ro'yxat ──────────────────────────────────────────── */}
      {signals.isLoading ? (
        <CardSkeleton count={4} />
      ) : signals.isError ? (
        <ErrorState
          message={
            signals.error instanceof ApiError ? signals.error.message : undefined
          }
          onRetry={() => void signals.refetch()}
        />
      ) : (signals.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={Radio}
          title="Signal topilmadi"
          // ⚠️ IZOH FILTRGA QARAB O'ZGARADI: "hech narsa yo'q" va
          // "filtr juda tor" — BOSHQA holatlar va foydalanuvchi
          // qaysi biri ekanini bilishi kerak.
          hint={
            filters.search || filters.kind || filters.severity || filters.mahallaId
              ? "Filtrlarni kengaytirib ko'ring."
              : "Rasmiy deb belgilangan guruhlarda hali ko'rishga arziydigan gap topilmadi. Guruhlar bo'limida kuzatuv yoqilganini tekshiring."
          }
        />
      ) : (
        <div className="space-y-3">
          {signals.data?.items.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              canAttach={can("signals.attach")}
              canDismiss={can("signals.dismiss")}
              onAttach={setAttachTarget}
              onDismiss={handleDismiss}
              isBusy={attach.isPending || dismiss.isPending}
            />
          ))}

          {/* ── Sahifalash ───────────────────────────────────── */}
          {signals.data && signals.data.total > signals.data.limit ? (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {signals.data.total} ta signal · {signals.data.page}-sahifa
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={signals.data.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
                  }
                >
                  Oldingi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!signals.data.hasMore}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
                  }
                >
                  Keyingi
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <AttachSignalDialog
        signal={attachTarget}
        onClose={() => setAttachTarget(null)}
        onSubmit={(input) =>
          attach.mutate(input, {
            // ⚠️ OYNA FAQAT MUVAFFAQIYATDA yopiladi: xato bo'lsa
            // (kategoriya o'chirilgan, signal allaqachon
            // biriktirilgan) operator xabarni ko'rib, qaytadan
            // urinishi kerak — oyna yopilsa u tanlovini
            // yo'qotardi.
            onSuccess: () => setAttachTarget(null),
          })
        }
        isSubmitting={attach.isPending}
      />
    </>
  );
}
