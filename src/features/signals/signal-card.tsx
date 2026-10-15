"use client";

/**
 * SIGNAL KARTASI.
 *
 * ── NIMA UCHUN KARTA, JADVAL EMAS ─────────────────────────────────────
 *
 * ⚠️ Signalning ASOSIY mazmuni — MATN (aholi yozgan gap) va u bir
 * necha qatorga cho'ziladi. Jadvalda u bitta yacheykaga siqilib,
 * kesilib ketardi — operator esa aynan o'sha matnni o'qib qaror
 * qabul qiladi. Murojaatlar JADVALDA ko'rsatiladi, chunki ularda
 * sarlavha qisqa va holat/ijrochi/muddat ustunlari muhimroq.
 *
 * ── MATN AI'NING EMAS, ODAMNING ───────────────────────────────────────
 *
 * ⚠️ `summary` — XABARNING O'Z MATNI. Shuning uchun u kartada
 * IQTIBOS sifatida ko'rsatiladi (chap chiziq bilan): operator buni
 * "AI shunday deb o'yladi" emas, "odam shunday yozdi" deb o'qishi
 * kerak.
 */

import { CheckCircle2, ExternalLink, MessageSquare, XCircle } from "lucide-react";

import type { Signal } from "@/shared/api/types";
import { SIGNAL_KIND, SIGNAL_SEVERITY, SIGNAL_STATUS } from "@/shared/config/labels";
import { formatDateTimeUz, formatRelativeUz } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

interface Props {
  signal: Signal;
  canAttach: boolean;
  canDismiss: boolean;
  onAttach: (signal: Signal) => void;
  onDismiss: (signal: Signal) => void;
  isBusy?: boolean;
}

export const SignalCard = ({
  signal,
  canAttach,
  canDismiss,
  onAttach,
  onDismiss,
  isBusy,
}: Props) => {
  const kind = SIGNAL_KIND[signal.kind];
  const severity = SIGNAL_SEVERITY[signal.severity];
  const status = SIGNAL_STATUS[signal.status];

  const isNew = signal.status === "new";

  return (
    <Card
      className={cn(
        // ⚠️ YUQORI JIDDIYLIK CHAP CHIZIQ BILAN ajratiladi, butun
        // kartani qizil qilish emas: ro'yxatda bir nechta shunday
        // karta bo'lsa, ekran butunlay qizil bo'lib, ajratish
        // ma'nosi yo'qolardi.
        signal.severity === "high" && isNew && "border-l-4 border-l-destructive",
      )}
    >
      <CardContent className="space-y-3 p-4">
        {/* ── Yorliqlar ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={kind.className}>{kind.label}</Badge>
          <Badge className={severity.className}>{severity.label}</Badge>

          {/* ⚠️ `new` holati KO'RSATILMAYDI: ro'yxat standart holda
              faqat yangilarini ko'rsatadi, ya'ni yorliq hamma
              kartada takrorlanib, shovqin bo'lardi. */}
          {!isNew ? <Badge className={status.className}>{status.label}</Badge> : null}

          <span className="ml-auto text-xs text-muted-foreground">
            {formatRelativeUz(signal.createdAt)}
          </span>
        </div>

        {/* ── Xabar matni (IQTIBOS) ───────────────────────────── */}
        <blockquote className="border-l-2 border-muted pl-3 text-sm leading-relaxed">
          {signal.summary}
        </blockquote>

        {/* ── Manba ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{signal.group.title}</span>

          {signal.group.mahalla ? (
            <span>
              {signal.group.mahalla.name} · {signal.group.mahalla.district.name}
            </span>
          ) : (
            // ⚠️ BIRIKTIRILMAGAN GURUH AJRATIB KO'RSATILADI: bu
            // "MFY biriktirish ishi qoldi" degan signalning o'zi.
            <span className="text-amber-600 dark:text-amber-400">
              MFY biriktirilmagan
            </span>
          )}

          {signal.senderName ? <span>Yozgan: {signal.senderName}</span> : null}

          {signal.sentAt ? <span>{formatDateTimeUz(signal.sentAt)}</span> : null}

          {/* ⚠️ QAMROV: AI nechta xabarni ko'rib shu xulosaga
              kelgan. Bu "bir gapdan" va "o'ttiz gapdan" chiqqan
              signalni ajratadi. */}
          {signal.messageCount > 1 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" />
              {signal.messageCount}
            </span>
          ) : null}
        </div>

        {/* ── Amallar ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/*
            ⚠️ HAVOLA BIRINCHI: operator qaror qabul qilishdan OLDIN
            xabarni kontekstda ko'rishi kerak ("bu hazilmi yoki
            haqiqiy shikoyat").

            ⚠️ `t.me/c/...` havolasi faqat O'SHA GURUH A'ZOSIGA
            ochiladi. Bu kamchilik emas: guruhda bo'lmagan odam
            xabarni ko'rmasligi to'g'ri.
          */}
          {signal.messageLink ? (
            <Button variant="outline" size="sm" asChild>
              <a href={signal.messageLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
                Xabarni ochish
              </a>
            </Button>
          ) : null}

          {isNew && canAttach ? (
            <Button size="sm" onClick={() => onAttach(signal)} disabled={isBusy}>
              <CheckCircle2 className="size-3.5" />
              Murojaatga aylantirish
            </Button>
          ) : null}

          {isNew && canDismiss ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(signal)}
              disabled={isBusy}
            >
              <XCircle className="size-3.5" />
              Muammo emas
            </Button>
          ) : null}

          {/* ── Yopilgan signalning izi ───────────────────────── */}
          {signal.issue ? (
            <span className="text-xs text-muted-foreground">
              Murojaat:{" "}
              <a
                href={`/issues/${signal.issue.id}`}
                className="font-medium text-primary hover:underline"
              >
                {signal.issue.publicNo}
              </a>
            </span>
          ) : null}

          {signal.status === "dismissed" ? (
            <span className="text-xs text-muted-foreground">
              {signal.dismissedBy
                ? `${signal.dismissedBy.firstName} ${signal.dismissedBy.lastName}`
                : "Kimdir"}{" "}
              e&apos;tiborsiz qoldirdi
              {signal.dismissedReason ? `: ${signal.dismissedReason}` : ""}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
