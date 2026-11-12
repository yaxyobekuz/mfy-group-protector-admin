"use client";

/**
 * TARQATMA — tuman/MFY kesimida xabar yuborish.
 *
 * ── IKKI AUDITORIYA ───────────────────────────────────────────────────
 *
 * ⚠️ FUQARO va GURUH — BOSHQA-BOSHQA NARSA va ular ALOHIDA sanaladi:
 * guruhdagi odam botga yozmagan bo'lishi mumkin va teskarisi ham.
 * Qo'shilsa, bir odam ikki marta sanalardi.
 *
 * ⚠️ GURUHGA YUBORISH — KUCHLIROQ AMAL: xabarni o'chirib bo'lmaydi va
 * u yuzlab odamning ko'z o'ngida turadi. Shuning uchun u STANDART
 * tanlov emas.
 *
 * ── BOTDAN YUBORISH ───────────────────────────────────────────────────
 *
 * ⚠️ UZATILGAN XABAR (`forward`/`copy`) FAQAT BOTDAN keladi: adminning
 * Telegram chatidagi xabar Telegram ichida nusxalanadi va baytlar
 * server orqali O'TMAYDI. Panelda esa faqat MATN yoziladi — bu yerda
 * surat yuklash maydoni YO'Q va bo'lishi ham shart emas.
 */

import { useMemo, useState } from "react";
import { Megaphone, Send, Users, MessagesSquare } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAudienceSize,
  useBroadcasts,
  useSendBroadcast,
  type BroadcastTarget,
} from "@/features/broadcasts/api";
import { useDistricts, useMahallas } from "@/features/territory/api";
import { ApiError } from "@/shared/api/client";
import type { BroadcastAudience } from "@/shared/api/types";
import {
  AUDIENCE_LABELS,
  BROADCAST_MODE_LABELS,
  BROADCAST_STATUS,
} from "@/shared/config/labels";
import { formatDateTimeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label, Textarea } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CardSkeleton, EmptyState, ErrorState, Spinner } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";

const ALL = "__all__";

const MESSAGE_MIN = 3;
const MESSAGE_MAX = 4000;

export default function BroadcastsPage() {
  const { can } = useSession();

  const [audience, setAudience] = useState<BroadcastAudience>("citizens");
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [mahallaId, setMahallaId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  const districts = useDistricts();
  const mahallas = useMahallas(districtId ? { districtId } : {});
  const broadcasts = useBroadcasts({ page: 1, limit: 30 });
  const send = useSendBroadcast();

  /**
   * ⚠️ HAJM SO'ROVI HUDUD O'ZGARGANDA QAYTA KETADI, lekin MATN
   * yozilganda EMAS: `target` matnga bog'liq bo'lsa, har harfda
   * serverga so'rov ketardi.
   */
  const target: BroadcastTarget = useMemo(
    () => ({
      audience,
      districtId: districtId ?? undefined,
      mahallaId: mahallaId ?? undefined,
    }),
    [audience, districtId, mahallaId],
  );

  const size = useAudienceSize(target);

  if (!can("broadcast.send")) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Sizda bu bo'limga ruxsat yo'q"
        hint="Tarqatma — qaytarib bo'lmaydigan amal, shuning uchun u alohida ruxsat talab qiladi."
      />
    );
  }

  const trimmed = message.trim();
  const canSend = trimmed.length >= MESSAGE_MIN && (size.data?.total ?? 0) > 0;

  const areaLabel = mahallaId
    ? (mahallas.data?.find((item) => item.id === mahallaId)?.name ?? "tanlangan MFY")
    : districtId
      ? (districts.data?.find((item) => item.id === districtId)?.name ?? "tanlangan tuman")
      : "Butun viloyat";

  const handleSend = () => {
    send.mutate(
      {
        audience,
        mode: "text",
        message: trimmed,
        districtId: districtId ?? undefined,
        mahallaId: mahallaId ?? undefined,
      },
      {
        onSuccess: () => {
          setMessage("");
          setConfirming(false);
        },
      },
    );
  };

  return (
    <>
      <PageHeader title="Tarqatma" />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* ── YANGI TARQATMA ──────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Yangi xabar</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kimga</Label>
              <Select
                value={audience}
                onValueChange={(value) => setAudience(value as BroadcastAudience)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="citizens">{AUDIENCE_LABELS.citizens}</SelectItem>
                  <SelectItem value="groups">{AUDIENCE_LABELS.groups}</SelectItem>
                  <SelectItem value="both">{AUDIENCE_LABELS.both}</SelectItem>
                </SelectContent>
              </Select>

              {/*
                ⚠️ GURUH TANLANGANDA OGOHLANTIRISH: guruhga yuborilgan
                xabarni o'chirib bo'lmaydi va u butun mahalla oldida
                turadi. Fuqaro chatiga yuborilgan xabar esa shaxsiy.
              */}
              {audience !== "citizens" ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  Xabar MFY guruhlariga, hamma ko&apos;radigan joyga tushadi.
                  O&apos;chirib bo&apos;lmaydi.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Tuman</Label>
              <Select
                value={districtId ?? ALL}
                onValueChange={(value) => {
                  setDistrictId(value === ALL ? null : value);
                  // ⚠️ MFY TOZALANADI: eski tanlov yangi tumanga
                  // tegishli emas va u qolsa, so'rov rad etilardi.
                  setMahallaId(null);
                  setConfirming(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Butun viloyat</SelectItem>
                  {districts.data?.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {districtId ? (
              <div className="space-y-1.5">
                <Label>MFY</Label>
                <Select
                  value={mahallaId ?? ALL}
                  onValueChange={(value) => {
                    setMahallaId(value === ALL ? null : value);
                    setConfirming(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Butun tuman</SelectItem>
                    {mahallas.data?.map((mahalla) => (
                      <SelectItem key={mahalla.id} value={mahalla.id}>
                        {mahalla.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="broadcast-message">Xabar matni</Label>
              <Textarea
                id="broadcast-message"
                rows={6}
                maxLength={MESSAGE_MAX}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setConfirming(false);
                }}
                placeholder="Masalan: Hurmatli fuqarolar, 15-noyabr kuni hashar o'tkaziladi..."
              />
              <p className="text-xs text-muted-foreground">
                {trimmed.length}/{MESSAGE_MAX}
              </p>
            </div>

            {/*
              ── AUDITORIYA HAJMI ─────────────────────────────────
              ⚠️ YUBORISHDAN OLDIN KO'RSATILADI: "1 240 kishiga
              yuboriladi" degan son hudud noto'g'ri tanlanganini
              TO'XTATADI. Usiz xato faqat yuborilgandan KEYIN
              bilinardi.
            */}
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              {size.isLoading ? (
                <span className="text-muted-foreground">Hisoblanmoqda…</span>
              ) : size.isError ? (
                <span className="text-destructive">
                  {size.error instanceof ApiError
                    ? size.error.message
                    : "Hajmni hisoblab bo'lmadi"}
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4 text-muted-foreground" />
                    <strong>{size.data?.citizens ?? 0}</strong> fuqaro
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessagesSquare className="size-4 text-muted-foreground" />
                    <strong>{size.data?.groups ?? 0}</strong> guruh
                  </span>
                </div>
              )}
            </div>

            {/* ⚠️ IKKI BOSQICHLI TASDIQ: keng qamrovli amal bir
                bosishda yuborilmasligi kerak. */}
            {confirming ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <strong>{areaLabel}</strong> —{" "}
                <strong>{size.data?.total ?? 0}</strong> manzilga yuboriladi. Davom
                etasizmi?
              </p>
            ) : null}

            {confirming ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirming(false)}
                  disabled={send.isPending}
                >
                  Bekor qilish
                </Button>
                <Button
                  className="flex-1"
                  disabled={!canSend || send.isPending}
                  onClick={handleSend}
                >
                  {send.isPending ? <Spinner className="mr-1.5 size-4" /> : null}
                  Ha, yuborish
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={!canSend}
                onClick={() => setConfirming(true)}
              >
                <Send className="mr-1.5 size-4" />
                Yuborish
              </Button>
            )}

            {/*
              ⚠️ BOT YO'LI SHU YERDA ESLATILADI: surat/video yoki
              boshqa kanaldan uzatilgan xabarni panel yubora
              OLMAYDI — u Telegram ichida nusxalanadi.
            */}
            <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              Surat, video yoki boshqa kanaldan <strong>forward</strong> qilingan
              xabarni yuborish uchun botga <code>/admin</code> deb yozing. Telegram
              hisobingiz panelda bog&apos;langan bo&apos;lishi kerak (Adminlar →
              tahrirlash → Telegram ID).
            </p>
          </CardContent>
        </Card>

        {/* ── TARIX ───────────────────────────────────────────── */}
        <div className="space-y-3 lg:col-span-3">
          {broadcasts.isLoading ? (
            <CardSkeleton count={4} />
          ) : broadcasts.isError ? (
            <ErrorState
              message={
                broadcasts.error instanceof ApiError
                  ? broadcasts.error.message
                  : undefined
              }
              onRetry={() => void broadcasts.refetch()}
            />
          ) : (broadcasts.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="Hali tarqatma yuborilmagan"
              hint="Chapdagi shakl orqali birinchi xabarni yuboring."
            />
          ) : (
            broadcasts.data?.items.map((item) => {
              /**
               * ⚠️ TANILMAGAN HOLAT KALIT KO'RINISHIDA CHIQADI: server
               * yangi holat qo'shsa, panel yiqilmasligi kerak (audit
               * jurnalidagi ayni yondashuv).
               */
              const status = BROADCAST_STATUS[item.status] ?? {
                label: item.status,
                className: "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300",
              };

              return (
                <Card key={item.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={status.className}>{status.label}</Badge>
                    <Badge className="bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {AUDIENCE_LABELS[item.audience]}
                    </Badge>
                    <Badge className="bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {BROADCAST_MODE_LABELS[item.mode]}
                    </Badge>
                    {item.via === "bot" ? (
                      <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                        Botdan
                      </Badge>
                    ) : null}
                  </div>

                  {item.text ? (
                    <p className="mt-2 line-clamp-3 text-sm">{item.text}</p>
                  ) : (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      Uzatilgan xabar (matn saqlanmaydi)
                    </p>
                  )}

                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.mahalla?.name ?? item.district?.name ?? "Butun viloyat"} ·{" "}
                    {formatDateTimeUz(item.createdAt)}
                    {item.author
                      ? ` · ${item.author.firstName} ${item.author.lastName}`.trimEnd()
                      : null}
                  </p>

                  {/*
                    ⚠️ UCHTA SON ALOHIDA: `sent` ≠ `total` BO'LISHI
                    NORMAL — botni bloklagan odamga xabar yetmaydi va
                    bu buzilish emas.
                  */}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    <span>
                      Yuborildi: <strong>{item.sent}</strong> / {item.total}
                    </span>
                    {item.failed > 0 ? (
                      <span className="text-amber-700 dark:text-amber-300">
                        Yetib bormadi: <strong>{item.failed}</strong>
                      </span>
                    ) : null}
                  </div>

                  {item.error ? (
                    <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      {item.error}
                    </p>
                  ) : null}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
