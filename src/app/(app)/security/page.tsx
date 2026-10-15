"use client";

/**
 * XAVFSIZLIK SAHIFASI — "guruhda nima bloklandi".
 *
 * ⚠️ BU SIGNALLAR SAHIFASI EMAS. U yerda AI TAXMIN qiladi va
 * operator QAROR qabul qiladi; bu yerda esa bot ALLAQACHON harakat
 * qilgan (xabar o'chirilgan) va sahifa faqat NIMA BO'LGANINI
 * ko'rsatadi. Shuning uchun kartalarda tugma yo'q — jurnal
 * append-only.
 *
 * ⚠️ KARTA, JADVAL EMAS: hodisaning mazmuni — dalil (fayl nomi,
 * havola, o'chirilgan xabar matni) va u bir necha qatorga
 * cho'ziladi. Jadval yacheykasida u kesilib ketardi, ma'muriyat esa
 * aynan o'sha matnni o'qib "bu haqiqatan zararlimi" deb baholaydi.
 */

import { useState } from "react";
import { FileWarning, Link2, ShieldAlert, ShieldCheck } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useSecurityEvents,
  useSecurityStats,
  type SecurityFilters,
} from "@/features/security/api";
import { useMahallas } from "@/features/territory/api";
import type { SecurityEvent, ThreatAction, ThreatKind } from "@/shared/api/types";
import {
  THREAT_ACTION,
  THREAT_KIND,
  threatReason,
} from "@/shared/config/labels";
import { formatDateTimeUz, formatRelativeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CardSkeleton, EmptyState, ErrorState } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

/** "Hammasi" variantining qiymati — `undefined` ni Select qabul qilmaydi. */
const ALL = "__all__";

export default function SecurityPage() {
  const { can } = useSession();

  const [filters, setFilters] = useState<SecurityFilters>({
    page: 1,
    limit: 25,
  });

  const stats = useSecurityStats();
  const events = useSecurityEvents(filters);
  const mahallas = useMahallas({});

  const patch = (next: Partial<SecurityFilters>) =>
    // ⚠️ FILTR O'ZGARSA SAHIFA 1 GA QAYTADI: 5-sahifada turib
    // filtrni toraytirsa, natija bo'sh ko'rinardi va foydalanuvchi
    // "hech narsa topilmadi" deb o'ylardi.
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));

  if (!can("security.view")) {
    return (
      <EmptyState
        title="Sizda bu bo'limga ruxsat yo'q"
        hint="Ma'muriyatga murojaat qiling — ular ruxsatlarni xodimlar bo'limida beradi."
      />
    );
  }

  const data = stats.data;
  const hasFilters = Boolean(
    filters.kind || filters.action || filters.mahallaId || filters.senderTgId,
  );

  return (
    <>
      <PageHeader title="Xavfsizlik" />

      {/* ── KO'RSATKICHLAR ──────────────────────────────────── */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Oxirgi 24 soat"
          value={data?.last24h ?? "—"}
          icon={ShieldAlert}
          featured
          hint="Aniqlangan tahdidlar"
        />

        <StatTile
          label="O'chirildi"
          value={data?.deleted ?? "—"}
          icon={ShieldCheck}
          tone="success"
          hint="Guruhdan olib tashlandi"
        />

        {/*
          ⚠️ "O'CHIRILMADI" ALOHIDA PLITKA va u E'TIBOR rangida:
          bot admin bo'lmasa o'chira olmaydi va zararli fayl
          guruhda QOLADI. Bu raqam nolga teng bo'lmasa —
          ma'muriyat botga admin huquqini berishi kerak.
        */}
        <StatTile
          label="O'chirilmadi"
          value={data?.failed ?? "—"}
          icon={FileWarning}
          tone={data?.failed ? "danger" : "default"}
          hint={
            data?.failed
              ? "Botda o'chirish huquqi yo'q"
              : "Hammasi o'chirildi"
          }
        />

        <StatTile
          label="Qalqon yoqilgan"
          value={
            data ? `${data.guardedGroups}/${data.totalGroups}` : "—"
          }
          icon={ShieldCheck}
          tone={
            data && data.guardedGroups < data.totalGroups ? "warning" : "default"
          }
          hint="Guruhlar bo'limida yoqiladi"
          href="/groups"
        />
      </div>

      {/* ── FILTRLAR ────────────────────────────────────────── */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={filters.kind ?? ALL}
          onValueChange={(value) =>
            patch({ kind: value === ALL ? undefined : (value as ThreatKind) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Barcha turlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha turlar</SelectItem>
            {Object.entries(THREAT_KIND).map(([key, def]) => (
              <SelectItem key={key} value={key}>
                {def.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.action ?? ALL}
          onValueChange={(value) =>
            patch({ action: value === ALL ? undefined : (value as ThreatAction) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Barcha natijalar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha natijalar</SelectItem>
            {Object.entries(THREAT_ACTION).map(([key, def]) => (
              <SelectItem key={key} value={key}>
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
            <SelectValue placeholder="Barcha MFY" />
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

        {/*
          ⚠️ YUBORUVCHI BO'YICHA QIDIRUV: "bu odam yana tashladimi"
          — takroriy tarqatuvchini topishning yagona yo'li.
        */}
        <Input
          placeholder="Yuboruvchi Telegram ID"
          value={filters.senderTgId ?? ""}
          onChange={(event) =>
            patch({ senderTgId: event.target.value.trim() || undefined })
          }
        />
      </div>

      {/* ── RO'YXAT ─────────────────────────────────────────── */}
      {events.isLoading ? (
        <CardSkeleton count={4} />
      ) : events.isError ? (
        <ErrorState
          message={(events.error as Error).message}
          onRetry={() => void events.refetch()}
        />
      ) : !events.data?.items.length ? (
        <EmptyState
          icon={ShieldCheck}
          title={hasFilters ? "Hodisa topilmadi" : "Hali hech narsa bloklanmagan"}
          hint={
            hasFilters
              ? "Filtrlarni kengaytirib ko'ring."
              : "Qalqon yoqilgan guruhlarda zararli fayl yoki havola aniqlansa, u shu yerda ko'rinadi."
          }
        />
      ) : (
        <>
          <div className="grid gap-3">
            {events.data.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {events.data.hasMore ? (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
                }
              >
                Yana ko&apos;rsatish
              </Button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

/**
 * HODISA KARTASI.
 *
 * ⚠️ DALIL BIRINCHI O'RINDA: fayl nomi yoki havola — ma'muriyat
 * birinchi qidiradigan narsa. Guruh va yuboruvchi esa kontekst va
 * ular pastda turadi.
 */
const EventCard = ({ event }: { event: SecurityEvent }) => {
  const kind = THREAT_KIND[event.kind];
  const action = THREAT_ACTION[event.action];

  // ⚠️ O'CHIRILMAGAN HODISA AJRATILADI: zararli fayl guruhda
  // QOLGAN va bu e'tibor talab qiladi.
  const isUnresolved = event.action !== "deleted";

  return (
    <Card
      className={
        isUnresolved
          ? "overflow-hidden border-l-4 border-l-destructive"
          : undefined
      }
    >
      <CardContent className="space-y-3.5 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={kind.className}>{kind.label}</Badge>
          <Badge className={action.className}>{action.label}</Badge>

          <span className="ml-auto text-xs text-muted-foreground">
            {formatRelativeUz(event.createdAt)}
          </span>
        </div>

        {/* ── DALIL ──────────────────────────────────────────── */}
        <div className="rounded-xl bg-muted/60 p-4">
          {event.fileName ? (
            <div className="flex items-start gap-2.5">
              <FileWarning className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="min-w-0 space-y-1">
                {/*
                  ⚠️ `break-all`: fayl nomi uzun va bo'shliqsiz
                  bo'lishi mumkin — u kartadan chiqib ketardi.
                */}
                <p className="break-all font-mono text-sm font-medium">
                  {event.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.fileMime ?? "tur noma'lum"}
                  {event.fileSize
                    ? ` · ${Math.round(event.fileSize / 1024)} KB`
                    : ""}
                </p>
              </div>
            </div>
          ) : event.url ? (
            <div className="flex items-start gap-2.5">
              <Link2 className="mt-0.5 size-4 shrink-0 text-destructive" />
              {/*
                ⚠️ HAVOLA MATN SIFATIDA, `<a>` EMAS: ma'muriyat
                uni tasodifan bosib, zararli saytga tushmasligi
                kerak.
              */}
              <p className="min-w-0 break-all font-mono text-sm">{event.url}</p>
            </div>
          ) : null}

          <p className="mt-2.5 text-xs text-muted-foreground">
            {threatReason(event.reason)}
          </p>
        </div>

        {/*
          ⚠️ XABAR MATNI KO'RSATILADI: xabar O'CHIRILGAN va
          ma'muriyat uni Telegram'dan boshqa KO'RA OLMAYDI.
        */}
        {event.messageText ? (
          <blockquote className="rounded-xl border-l-[3px] border-l-muted-foreground/30 bg-muted/40 py-2.5 pl-4 pr-3 text-sm leading-relaxed">
            {event.messageText}
          </blockquote>
        ) : null}

        {/* ── MANBA ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {event.group.title}
          </span>

          {event.group.mahalla ? (
            <span>
              {event.group.mahalla.name} · {event.group.mahalla.district.name}
            </span>
          ) : (
            <span className="text-severity-normal">MFY biriktirilmagan</span>
          )}

          {event.senderName || event.senderUsername ? (
            <span>
              Yuborgan: {event.senderName ?? ""}
              {event.senderUsername ? ` (@${event.senderUsername})` : ""}
            </span>
          ) : null}

          {event.senderTgId ? (
            <span className="font-mono">ID: {event.senderTgId}</span>
          ) : null}

          {event.sentAt ? <span>{formatDateTimeUz(event.sentAt)}</span> : null}
        </div>

        {/*
          ⚠️ XATO SABABI KO'RSATILADI: "o'chirilmadi" ni ko'rgan
          ma'muriyat NIMA QILISH kerakligini bilishi kerak
          (ko'pincha — botga admin huquqini berish).
        */}
        {event.errorMessage ? (
          <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
            {event.errorMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};
