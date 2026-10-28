"use client";

/**
 * TUMAN TAFSILOTI — xaritada tuman bosilganda ochiladigan panel.
 *
 * ⚠️ UCH OQIM UCH BO'LIMDA, bitta ro'yxatda EMAS: muammo, signal va
 * xavfsizlik har xil ishonch darajasiga ega (rasmiy fakt / AI
 * taxmini / qat'iy qoida). Aralashtirilsa, operator "12 ta muammo"
 * deb o'qib, aslida 8 tasi hali tasdiqlanmagan signal ekanini
 * bilmasdi.
 *
 * ⚠️ HAR BO'LIMDAN O'Z RO'YXATIGA HAVOLA: panel — xulosa, ish esa
 * o'sha bo'limda bajariladi. Bu yerda amal tugmalari (biriktirish,
 * yopish) YO'Q — ular qaror talab qiladi va qarorni xulosa
 * ekranidan bir bosishda qilish xato bo'lardi.
 */

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
  Radio,
  ShieldAlert,
  Timer,
  X,
} from "lucide-react";

import type { DistrictMapRow } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";

/** Panel ichidagi bitta raqam. */
const Metric = ({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warning" | "danger" | "success";
  hint?: string;
}) => (
  <div className="rounded-xl bg-secondary/60 px-3 py-2">
    <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    <p
      className={cn(
        "metric text-xl font-semibold leading-tight",
        {
          default: "text-foreground",
          warning: "text-severity-normal",
          danger: "text-destructive",
          success: "text-primary",
        }[tone],
      )}
    >
      {value}
    </p>
    {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
  </div>
);

const SectionHeader = ({
  icon: Icon,
  title,
  href,
  total,
}: {
  icon: typeof Radio;
  title: string;
  href: string;
  total: number;
}) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-muted-foreground" />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <span className="metric text-xs text-muted-foreground">({total})</span>
    </div>
    <Link
      href={href}
      className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
    >
      Ro&apos;yxat
      <ArrowRight className="size-3" />
    </Link>
  </div>
);

export const DistrictDetail = ({
  row,
  shapeName,
  categoryFiltered,
  onClose,
}: {
  row: DistrictMapRow | null;
  /** Bazada topilmagan tuman uchun — xaritadagi nomi. */
  shapeName: string;
  categoryFiltered: boolean;
  onClose: () => void;
}) => {
  /*
   * ⚠️ BAZADA YO'Q TUMAN — ALOHIDA HOLAT, bo'sh panel emas: "0 ta
   * murojaat" deb ko'rsatish YOLG'ON bo'lardi (tuman kiritilmagan,
   * murojaat bo'lmagani emas). Panel buni ochiq aytadi va nima
   * qilish kerakligini ko'rsatadi.
   */
  if (!row) {
    return (
      <aside className="flex h-full flex-col rounded-2xl border border-dashed border-border bg-card p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold">{shapeName}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-secondary"
            aria-label="Yopish"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Bu tuman bazaga <strong>kiritilmagan</strong> — shuning uchun unda
          ma&apos;lumot yo&apos;q. Xaritada u shtrix bilan ko&apos;rsatiladi.
        </p>

        <Link
          href="/territory"
          className="mt-3 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Hudud bo&apos;limida qo&apos;shish
          <ArrowRight className="size-3.5" />
        </Link>
      </aside>
    );
  }

  const q = `?districtId=${row.id}`;

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* ── Sarlavha ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{row.name}</p>
          <p className="text-xs text-muted-foreground">
            <code>{row.code}</code>
            {row.isArchived ? (
              <Badge className="ml-1.5 bg-muted text-muted-foreground">Arxiv</Badge>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition hover:bg-secondary"
          aria-label="Yopish"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* ── MUROJAATLAR ───────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={MessageSquareWarning}
            title="Murojaatlar"
            href={`/issues${q}`}
            total={row.issues}
          />
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Ochiq" value={row.open} tone={row.open > 0 ? "warning" : "default"} />
            <Metric
              label="Muddati o'tgan"
              value={row.overdue}
              tone={row.overdue > 0 ? "danger" : "default"}
            />
            <Metric label="Hal qilindi" value={row.resolved} tone="success" />
            <Metric label="Rad etildi" value={row.rejected} />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Hal qilish ulushi</p>
                <p className="metric text-sm font-semibold">
                  {row.resolutionRate === null ? "—" : `${row.resolutionRate}%`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2">
              <Timer className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">O&apos;rtacha vaqt</p>
                <p className="metric text-sm font-semibold">
                  {row.avgResolutionHours === null
                    ? "—"
                    : `${row.avgResolutionHours} soat`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SIGNALLAR ─────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={Radio}
            title="Signallar"
            href={`/signals${q}`}
            total={row.signals}
          />
          {categoryFiltered ? (
            /*
             * ⚠️ JIM NOL KO'RSATILMAYDI: kategoriya filtri signalga
             * TEGMAYDI (signalda kategoriya yo'q) va "0" deb
             * ko'rsatish "bu tumanda signal yo'q" degan noto'g'ri
             * xulosa berardi.
             */
            <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              Yo&apos;nalish filtri yoqilgan — signalda yo&apos;nalish
              bo&apos;lmagani uchun bu kesim hisoblanmadi.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Metric
                label="Ko'rilmagan"
                value={row.signalsNew}
                tone={row.signalsNew > 0 ? "warning" : "default"}
                hint="Odam qarori kutilmoqda"
              />
              <Metric
                label="Yuqori jiddiylik"
                value={row.signalsHigh}
                tone={row.signalsHigh > 0 ? "danger" : "default"}
              />
            </div>
          )}
        </section>

        {/* ── XAVFSIZLIK ────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={ShieldAlert}
            title="Xavfsizlik"
            href={`/security${q}`}
            total={row.security}
          />
          {categoryFiltered ? (
            <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              Yo&apos;nalish filtri yoqilgan — hisoblanmadi.
            </p>
          ) : row.security > 0 ? (
            <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">
                <strong className="metric">{row.security}</strong> ta zararli xabar
                o&apos;chirildi.
              </p>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              Hodisa qayd etilmagan
            </p>
          )}
        </section>
      </div>
    </aside>
  );
};
