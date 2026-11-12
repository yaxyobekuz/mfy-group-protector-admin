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
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  FileWarning,
  Link2,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAllowSecurityEvent,
  useRefreshFeed,
  useSecurityEvents,
  useSecurityStats,
  useSetFeedEnabled,
  useThreatFeeds,
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
import { Switch } from "@/shared/ui/switch";
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

export default function SecurityPage() {
  const { can } = useSession();

  // ⚠️ TUMANLAR XARITASIDAN O'TISH (`?districtId=...`).
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SecurityFilters>(() => ({
    districtId: searchParams.get("districtId") ?? undefined,
    page: 1,
    limit: 25,
  }));

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
        hint="Ma'muriyatga murojaat qiling — ular ruxsatlarni Adminlar bo'limida beradi."
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
      {/*
        ⚠️ BESH USTUN: plitka BESHTA bo'ldi va to'rt ustunda
        oxirgisi yolg'iz qatorda qolib, "bu alohida narsa" degan
        taassurot berardi — holbuki u ayni qatordagi o'lchov.
      */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

        {/*
          ⚠️ NOTO'G'RI O'CHIRISHLAR SANOG'I — QOIDA
          SIFATINING YAGONA O'LCHOVI. U o'smayotgan bo'lsa qoida
          aniq ishlayapti; o'syotgan bo'lsa ro'yxatni ko'rib
          chiqish kerak. Usiz "oddiy havolalar ham bloklanyapti"
          degan shikoyatni raqam bilan tekshirib bo'lmasdi.

          ⚠️ "XATO" RANGIDA EMAS, E'TIBOR rangida: xato —
          tizimda, lekin uni xodim allaqachon TUZATGAN.
        */}
        <StatTile
          label="Noto'g'ri o'chirilgan"
          value={data?.falsePositives ?? "—"}
          icon={ShieldOff}
          tone={data?.falsePositives ? "warning" : "default"}
          hint={
            data?.falsePositives
              ? "Oq ro'yxatga qo'shildi"
              : "Qoida aniq ishlayapti"
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

      {/*
        ── QALQON YOQILGAN, LEKIN ISHLAMAYDI ─────────────────

        ⚠️ ENG XAVFLI HOLAT VA U ALOHIDA QATORDA: `guardEnabled` —
        ma'muriyat XOHISHI, `canDeleteMessages` — Telegram RUXSATI.
        Ikkisi ajralganda qalqon panelda "yoqilgan" bo'lib
        ko'rinadi, amalda esa hech narsa o'chirilmaydi — va bot
        guruhga ogohlantirish YOZMAYDI, ya'ni buni hech kim
        sezmaydi.

        ⚠️ MATN NIMA QILISH KERAKLIGINI AYTADI: "huquq yo'q" degan
        quruq xabar ma'muriyatga yo'l ko'rsatmasdi.
      */}
      {data?.blindGroups ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <strong>{data.blindGroups}</strong> ta guruhda qalqon yoqilgan, lekin
          bot xabarlarni <strong>o&apos;chira olmaydi</strong>. Telegram&apos;da
          guruh → Administratorlar → bot → &laquo;Xabarlarni o&apos;chirish&raquo;
          huquqini yoqing.{" "}
          <Link href="/groups" className="underline">
            Guruhlar ro&apos;yxati
          </Link>
        </div>
      ) : null}

      {/* ── TASHQI TAHDID RO'YXATLARI ────────────────────────── */}
      <ThreatFeedsCard canManage={can("security.guard")} />

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
              <EventCard
                  key={event.id}
                  event={event}
                  canManage={can("security.guard")}
                />
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
const EventCard = ({
  event,
  canManage,
}: {
  event: SecurityEvent;
  canManage: boolean;
}) => {
  const kind = THREAT_KIND[event.kind];
  const action = THREAT_ACTION[event.action];
  const allow = useAllowSecurityEvent();

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

          {/*
            ⚠️ "NOTO'G'RI" BELGISI KO'RINADI: yozuv o'chirilmaydi
            (append-only), lekin u endi TAHDID emas — va bu
            qoidani tuzatish uchun yagona dalil.
          */}
          {event.isFalsePositive ? (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              <CheckCircle2 className="mr-0.5 size-3" />
              Noto&apos;g&apos;ri o&apos;chirilgan
            </Badge>
          ) : null}

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

          {/*
            ── NOTO'G'RI O'CHIRISHNI TUZATISH ────────────

            ⚠️ ODDIY HAVOLA HAM BLOKLANISHI MUMKIN va bu TIRIK
            holat: qora ro'yxatlar tashqi manbadan keladi
            (50 000 host) va ularga qonuniy sayt xato bilan
            tushishi mumkin. Bunday paytda guruh a'zosining
            xabari JIMGINA o'chib ketadi — bot ogohlantirish
            yozmaydi, ya'ni buni faqat shu yerda ko'rish
            mumkin.

            ⚠️ TUGMA FAQAT HOST BOR HODISADA: `.apk` fayli
            bo'yicha o'chirilgan xabarda oq ro'yxatga
            qo'shadigan narsa yo'q — tugma ko'rinsa, xodim
            uni bosib, "nega hech narsa o'zgarmadi" deb
            hayron bo'lardi.

            ⚠️ RUXSAT — `security.guard`: bu amal oq ro'yxatga
            host QO'SHADI, ya'ni himoyaning bir qismini
            o'chiradi.
          */}
          {canManage && !event.isFalsePositive && (event.urlHost || event.url) ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={allow.isPending}
                onClick={() => {
                  if (
                    confirm(
                      `${event.urlHost ?? "Bu manzil"} oq ro'yxatga qo'shiladi va bundan keyin o'chirilmaydi. Davom etasizmi?`,
                    )
                  ) {
                    allow.mutate(event.id);
                  }
                }}
              >
                {allow.isPending ? (
                  <Spinner className="mr-1.5 size-4" />
                ) : (
                  <ShieldOff className="mr-1.5 size-4" />
                )}
                Noto&apos;g&apos;ri o&apos;chirilgan — havolani tiklash
              </Button>

              {/*
                ⚠️ XABARNING O'ZI QAYTMAYDI va buni AYTISH kerak:
                Telegram API da o'chirilgan xabarni tiklash
                imkoni YO'Q. Aks holda xodim tugmani bosib,
                xabar guruhga qaytadi deb o'ylardi.
              */}
              <p className="text-xs text-muted-foreground">
                Xabarning o&apos;zi qaytmaydi — havola bundan keyin
                bloklanmaydi.
              </p>
            </div>
          ) : null}
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

/**
 * TASHQI TAHDID RO'YXATLARI — O'ZI YANGILANADIGAN QORA RO'YXAT.
 *
 * ⚠️ QO'LDAGI QORA RO'YXAT HAR DOIM KECHIKADI: yangi firibgar
 * domen ertalab paydo bo'lib, kechqurun bloklanardi — oradagi vaqtda
 * aholi havolani bosib ulgurardi. URLhaus, OpenPhish va shunga
 * o'xshash ro'yxatlar esa SOATLAB yangilanadi.
 *
 * ⚠️ O'RNINI BOSMAYDI, QO'SHIMCHA: mahalliy firibgar domenlar
 * (`uzbekistonviplata.xyz`) tashqi ro'yxatlarga umuman tushmaydi.
 * Oq ro'yxat esa ikkalasidan ham USTUN.
 *
 * ⚠️ XATO KO'RSATILISHI SHART: ro'yxat bir hafta yuklanmay turgan
 * bo'lsa, himoya eskirib ketganini faqat shu yozuv aytadi.
 */
const ThreatFeedsCard = ({ canManage }: { canManage: boolean }) => {
  const feeds = useThreatFeeds();
  const refresh = useRefreshFeed();
  const setEnabled = useSetFeedEnabled();

  // ⚠️ RO'YXAT BO'SH BO'LSA KARTA UMUMAN CHIQMAYDI: bo'sh karta
  // sahifani uzaytirib, hech narsa bermasdi.
  if (feeds.isLoading || (feeds.data?.length ?? 0) === 0) return null;

  return (
    <Card className="mb-5">
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="text-sm font-medium">Tashqi tahdid ro&apos;yxatlari</p>
          <p className="text-xs text-muted-foreground">
            O&apos;zi yangilanadigan fishing va zararli domen ro&apos;yxatlari.
            Panelda qo&apos;lda kiritilgan qora ro&apos;yxat bilan BIRGA
            ishlaydi.
          </p>
        </div>

        <div className="divide-y rounded-lg border">
          {feeds.data?.map((feed) => (
            <div
              key={feed.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{feed.name}</span>
                  {feed.isEnabled ? (
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {feed.lastCount} domen
                    </Badge>
                  ) : (
                    <Badge className="bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                      O&apos;chirilgan
                    </Badge>
                  )}
                </div>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {feed.lastFetchedAt
                    ? `Yangilangan: ${formatRelativeUz(feed.lastFetchedAt)}`
                    : "Hali yuklanmagan"}
                </p>

                {/*
                  ⚠️ XATO QIZIL RANGDA VA TO'LIQ: "yuklanmadi" degan
                  quruq xabar ma'muriyatga manba manzili o'zgarganini
                  aytmasdi.
                */}
                {feed.lastError ? (
                  <p className="mt-1 text-xs text-destructive">{feed.lastError}</p>
                ) : null}
              </div>

              {canManage ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={refresh.isPending || !feed.isEnabled}
                    onClick={() => refresh.mutate(feed.id)}
                  >
                    Yangilash
                  </Button>
                  <Switch
                    checked={feed.isEnabled}
                    disabled={setEnabled.isPending}
                    onCheckedChange={(checked) =>
                      setEnabled.mutate({ id: feed.id, isEnabled: checked })
                    }
                    aria-label="Ro'yxatni yoqish"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
