"use client";

/**
 * TARQATMA TARIXI — HOLAT, NAZORAT VA YETKAZISH JURNALI.
 *
 * ⚠️ RO'YXAT EMAS, ISH QUROLI: operatorga "yuborildi" degan son
 * yetmaydi — unga QAYSI manzilga yetmagani, NEGA yetmagani va
 * kimga QAYTA yuborish kerakligi kerak. Avval bularning hech
 * biri yo'q edi.
 *
 * ⚠️ UCH SON UCH BOSHQA NARSA (`sent` / `blocked` / `failed`):
 * "bot bloklangan" — normal hol va u bilan hech narsa qilib
 * bo'lmaydi; tarmoq xatosi esa aynan qayta yuborishni talab
 * qiladi. Bitta "xato" soniga qo'shilsa, operator har
 * tarqatmadan keyin qo'rqinchli raqamni ko'rib, sababini izlab
 * yurardi.
 */

import { useState } from "react";
import {
  Ban,
  ChevronDown,
  ChevronRight,
  Megaphone,
  Pin,
  RotateCcw,
  VolumeX,
} from "lucide-react";

import {
  useBroadcastRecipients,
  useBroadcasts,
  useCancelBroadcast,
  useRetryBroadcast,
} from "@/features/broadcasts/api";
import type { Broadcast, BroadcastDelivery } from "@/shared/api/types";
import {
  AUDIENCE_LABELS,
  BROADCAST_MODE_LABELS,
  BROADCAST_STATUS,
  DELIVERY_LABELS,
  TARGET_KIND_LABELS,
} from "@/shared/config/labels";
import { cn } from "@/shared/lib/cn";
import { formatDateTimeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { CardSkeleton, EmptyState } from "@/shared/ui/states";

/** Tugagan tarqatmani to'xtatib bo'lmaydi. */
const isLive = (status: Broadcast["status"]): boolean =>
  status === "pending" || status === "sending" || status === "scheduled";

export const BroadcastHistory = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const broadcasts = useBroadcasts({ limit: 20 });

  if (broadcasts.isLoading) return <CardSkeleton count={3} />;

  if ((broadcasts.data?.items.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Hali tarqatma yuborilmagan"
        hint="Yuborilgan xabarlar shu yerda, yetkazish hisoboti bilan ko'rinadi."
      />
    );
  }

  return (
    <div className="space-y-3">
      {broadcasts.data?.items.map((item) => (
        <BroadcastRow
          key={item.id}
          item={item}
          open={openId === item.id}
          onToggle={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
        />
      ))}
    </div>
  );
};

const BroadcastRow = ({
  item,
  open,
  onToggle,
}: {
  item: Broadcast;
  open: boolean;
  onToggle: () => void;
}) => {
  const cancel = useCancelBroadcast();
  const retry = useRetryBroadcast();

  const status = BROADCAST_STATUS[item.status];

  /**
   * ⚠️ MAXRAJ — `total`, `sent` EMAS: yuborilayotgan tarqatmada
   * `sent` o'sib boradi va u maxraj bo'lsa, ko'rsatkich har doim
   * 100% ko'rinardi.
   */
  const done = item.sent + item.failed + item.blocked;
  const percent = item.total > 0 ? Math.round((done / item.total) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {status ? (
                <Badge className={status.className}>{status.label}</Badge>
              ) : null}
              <Badge>{AUDIENCE_LABELS[item.audience] ?? item.audience}</Badge>
              {item.mode !== "text" ? (
                <Badge>{BROADCAST_MODE_LABELS[item.mode]}</Badge>
              ) : null}
              {item.silent ? (
                <span title="Ovozsiz">
                  <VolumeX className="size-3.5 text-muted-foreground" />
                </span>
              ) : null}
              {item.pinMessage ? (
                <span title="Qadalgan">
                  <Pin className="size-3.5 text-muted-foreground" />
                </span>
              ) : null}
              {item.via === "bot" ? (
                <span className="text-[11px] text-muted-foreground">botdan</span>
              ) : null}
            </div>

            <p className="truncate text-sm font-medium">
              {item.title ?? item.text ?? "—"}
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {[
                item.district?.name,
                item.mahalla?.name,
                item.author
                  ? `${item.author.firstName} ${item.author.lastName}`
                  : null,
                /*
                 * ⚠️ REJALASHTIRILGANDA YUBORISH VAQTI KO'RSATILADI,
                 * YARATILGAN VAQTI EMAS: operator aynan "qachon
                 * chiqadi" degan savolga javob izlaydi.
                 */
                item.scheduledAt
                  ? `${formatDateTimeUz(item.scheduledAt)} da chiqadi`
                  : formatDateTimeUz(item.createdAt),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isLive(item.status) ? (
              <Button
                variant="outline"
                size="sm"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate(item.id)}
              >
                <Ban className="size-3.5" />
                To&apos;xtatish
              </Button>
            ) : null}

            {/*
              ⚠️ QAYTA YUBORISH FAQAT `failed` BO'LGANDA: bloklagan
              odamga qayta yuborish AYNI xatoni beradi — bu befoyda
              minglab so'rov va Telegram chegarasini bekorga yeyish.
            */}
            {item.failed > 0 && !isLive(item.status) ? (
              <Button
                variant="outline"
                size="sm"
                disabled={retry.isPending}
                onClick={() => retry.mutate(item.id)}
              >
                <RotateCcw className="size-3.5" />
                Qayta ({item.failed})
              </Button>
            ) : null}

            <Button variant="outline" size="sm" onClick={onToggle}>
              {open ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              Hisobot
            </Button>
          </div>
        </div>

        {/* ══ JARAYON ═══════════════════════════════════════ */}
        {item.total > 0 ? (
          <div className="mt-3">
            <div className="mb-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="tabular text-muted-foreground">
                {done} / {item.total}
              </span>
              <span className="tabular text-primary">{item.sent} yetdi</span>
              {item.blocked > 0 ? (
                <span className="tabular text-muted-foreground">
                  {item.blocked} bloklagan
                </span>
              ) : null}
              {item.failed > 0 ? (
                <span className="tabular text-destructive">{item.failed} yetmadi</span>
              ) : null}
            </div>

            {/*
              ⚠️ YO'LAK QOLADI (`bg-secondary`): usiz qisqa ustun
              "ma'lumot yo'q" dek ko'rinardi — endi u "to'liqning
              qanchasi" ekanini ko'rsatadi.
            */}
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  item.status === "failed" ? "bg-destructive" : "bg-primary",
                )}
                style={{ width: `${Math.max(2, percent)}%` }}
              />
            </div>
          </div>
        ) : null}

        {item.error ? (
          <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {item.error}
          </p>
        ) : null}
      </div>

      {open ? <DeliveryLog id={item.id} /> : null}
    </Card>
  );
};

/**
 * YETKAZISH JURNALI.
 *
 * ⚠️ STANDART HOLDA FAQAT YETMAGANLARI: 10 000 ta "yetdi"
 * qatorini varaqlashning ma'nosi yo'q — operatorga aynan
 * nosozliklar kerak.
 */
const DeliveryLog = ({ id }: { id: string }) => {
  const [filter, setFilter] = useState<BroadcastDelivery | undefined>("failed");

  const recipients = useBroadcastRecipients(id, filter);

  const FILTERS: { value: BroadcastDelivery | undefined; label: string }[] = [
    { value: "failed", label: "Yetmadi" },
    { value: "blocked", label: "Bloklagan" },
    { value: "sent", label: "Yetdi" },
    { value: undefined, label: "Hammasi" },
  ];

  return (
    <div className="border-t border-border bg-secondary/30 p-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition",
              filter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {recipients.isLoading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Yuklanmoqda…</p>
      ) : (recipients.data?.items.length ?? 0) === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Bu kesimda yozuv yo&apos;q
        </p>
      ) : (
        <>
          <ul className="space-y-1">
            {recipients.data?.items.map((row) => {
              const delivery = DELIVERY_LABELS[row.status];
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs"
                >
                  {delivery ? (
                    <Badge className={delivery.className}>{delivery.label}</Badge>
                  ) : null}
                  <span className="font-medium">
                    {row.title ?? TARGET_KIND_LABELS[row.kind]}
                  </span>
                  <span className="text-muted-foreground">
                    {TARGET_KIND_LABELS[row.kind]}
                  </span>
                  {/*
                    ⚠️ SABAB TO'LIQ KO'RSATILADI: "yetmadi" degan
                    so'z bilan hech narsa qilib bo'lmasdi —
                    "bot was kicked from the supergroup" esa aniq
                    chora talab qiladi (botni qaytarish).
                  */}
                  {row.error ? (
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {row.error}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/*
            ⚠️ JAMI SON AYTILADI: ro'yxat 100 tada kesiladi va usiz
            operator "hammasi shu" deb o'ylardi.
          */}
          {recipients.data && recipients.data.total > recipients.data.items.length ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {recipients.data.items.length} / {recipients.data.total} ta ko&apos;rsatildi
            </p>
          ) : null}
        </>
      )}
    </div>
  );
};
