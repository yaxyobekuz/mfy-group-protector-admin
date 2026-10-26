"use client";

/**
 * XARITA — MUROJAAT TAFSILOT PANELI (o'ng tomon).
 *
 * ⚠️ Marker bosilganda ochiladi. To'liq ma'lumotni `/issues/:id` dan
 * oladi (`/reports/map` faqat qisqa ma'lumot beradi). "To'liq ko'rish"
 * havolasi murojaat sahifasiga olib boradi.
 *
 * ⚠️ `pe-auto`: map sahifasida `main` pointer-shaffof, panel esa
 * bosiladigan bo'lishi kerak.
 */

import Link from "next/link";
import { ArrowRight, Building2, Clock, MapPin, User, X } from "lucide-react";

import { useIssue } from "@/features/issues/api";
import { fileUrl } from "@/shared/api/client";
import { categoryColor, categoryIcon } from "@/shared/config/category-icons";
import { ISSUE_STATUS } from "@/shared/config/labels";
import { formatDateTimeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CardSkeleton, ErrorState } from "@/shared/ui/states";

interface Props {
  issueId: string;
  onClose: () => void;
}

export const MapDetailPanel = ({ issueId, onClose }: Props) => {
  const issue = useIssue(issueId);
  const data = issue.data;

  const Icon = categoryIcon(data?.category.icon);
  const color = categoryColor(data?.category.color);
  const status = data ? ISSUE_STATUS[data.status] : null;

  return (
    // ⚠️ `pe-auto`: xarita pointer-shaffof `main` ichida bosiladi.
    // `fixed` o'ng chetда — xarita ustida suzadi, sahifa aylansa ham
    // joyida qoladi.
    <div className="pe-auto fixed right-4 top-4 z-[500] flex max-h-[calc(100vh-2rem)] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-card shadow-lift">
      {/* ── Sarlavha ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">
            {data?.category.name ?? "Yuklanmoqda…"}
          </p>
          {data ? (
            <code className="text-xs text-muted-foreground">{data.publicNo}</code>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Yopish"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* ── Tarkib ─────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {issue.isLoading ? (
          <CardSkeleton count={2} />
        ) : issue.isError || !data ? (
          <ErrorState onRetry={() => void issue.refetch()} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {status ? <Badge className={status.className}>{status.label}</Badge> : null}
              {data.isHazard ? (
                <Badge className="bg-destructive/10 text-destructive">Xavfli</Badge>
              ) : null}
            </div>

            {/* ⚠️ SARLAVHA MATN BILAN TAKRORLANMAYDI: `title` ko'pincha
                `body` ning BIRINCHI QATORIDAN olinadi (mobil/bot oqimi)
                va ikkalasini ko'rsatish ayni matnni ikki marta
                chiqarardi. Shuning uchun faqat farq qilganda ikkisi
                ham ko'rsatiladi. */}
            <div>
              {!data.body.trim().startsWith(data.title.replace(/\.\.\.$/, "")) ? (
                <p className="mb-1 text-sm font-semibold">{data.title}</p>
              ) : null}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.body}</p>
            </div>

            {/* Birinchi surat — "nima yuborilgani" ni ko'rsatadi. */}
            {data.attachments.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {data.attachments.slice(0, 6).map((file) => {
                  const url = fileUrl(file.path);
                  if (!url) return null;
                  return file.kind === "video" ? (
                    <video
                      key={file.id}
                      src={url}
                      className="aspect-square w-full rounded-lg object-cover"
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={file.id}
                      src={url}
                      alt=""
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  );
                })}
              </div>
            ) : null}

            {/* ⚠️ MA'LUMOT QATORLARI ALOHIDA KARTADA: matn va suratdan
                vizual ajralib tursin — aks holda hammasi bir uzun
                ro'yxatga qo'shilib ketardi. */}
            <div className="space-y-2.5 rounded-xl bg-secondary/50 p-3 text-sm">
              {data.address ? (
                <Row icon={<MapPin className="size-4" />} label="Manzil" value={data.address} />
              ) : null}
              {data.mahalla ? (
                <Row
                  icon={<Building2 className="size-4" />}
                  label="MFY"
                  value={`${data.mahalla.name}${
                    data.mahalla.district ? `, ${data.mahalla.district.name}` : ""
                  }`}
                />
              ) : null}
              {data.citizen ? (
                <Row
                  icon={<User className="size-4" />}
                  label="Yuborgan"
                  value={`${data.citizen.firstName} ${data.citizen.lastName ?? ""}`.trim()}
                />
              ) : null}
              {data.dueAt ? (
                <Row
                  icon={<Clock className="size-4" />}
                  label="Muddat"
                  value={formatDateTimeUz(data.dueAt)}
                />
              ) : null}
            </div>

            {data.resolution ? (
              <div className="rounded-lg bg-success/10 p-3 text-sm">
                <p className="text-xs font-medium text-success">Javob</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">{data.resolution}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Pastki havola ──────────────────────────────────────── */}
      <div className="border-t border-border p-3">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/issues/${issueId}`}>
            To&apos;liq ko&apos;rish
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

const Row = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
    <span className="min-w-0 flex-1">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className="block text-sm font-medium leading-snug">{value}</span>
    </span>
  </div>
);
