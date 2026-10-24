"use client";

/**
 * MOBIL MUROJAAT QISMLARI — surat, joy, fuqaro.
 *
 * ⚠️ ALOHIDA FAYLDA: murojaat kartasi allaqachon 500 qatordan
 * oshgan va unga yana uchta blok qo'shish uni o'qib bo'lmaydigan
 * qilardi. Bu qismlar FAQAT `source === "mobile"` da ko'rinadi,
 * ya'ni ular mustaqil birlik.
 */

import { ExternalLink, FileVideo, History, MapPin, RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { fileUrl } from "@/shared/api/client";
import type { IssueAttachment, IssueCitizen, IssueDetail } from "@/shared/api/types";
import { formatDateTimeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { MapView } from "@/widgets/issue-map/map-view";

// ═══════════════════════════════════════════════════════════════════
//  SURAT VA VIDEO
// ═══════════════════════════════════════════════════════════════════

/**
 * ⚠️ BU DALIL, BEZAK EMAS. Fuqaro "chiqindi uyumi" deb surat
 * yuborgan va murojaat hal qilinmay turib surat ko'rinmasa,
 * murojaatning asosi qolmaydi. Shuning uchun fayllar
 * append-only (`schema.prisma#IssueAttachment`) va panelda ular
 * matndan OLDIN ko'rsatiladi.
 */
export const AppealAttachments = ({
  attachments,
}: {
  attachments: IssueAttachment[];
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Fuqaro yuborgan fayllar ({attachments.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachments.map((item) => {
              const url = fileUrl(item.url)!;

              return item.kind === "video" ? (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <video
                    src={url}
                    controls
                    preload="metadata"
                    className="aspect-square w-full object-cover"
                  />
                  <p className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground">
                    <FileVideo className="size-3" />
                    {Math.round(item.size / 1024 / 1024)} MB
                  </p>
                </div>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreview(url)}
                  className="aspect-square overflow-hidden rounded-xl border border-border bg-muted transition hover:opacity-90"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={item.originalName ?? ""}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/*
        ⚠️ O'Z OYNASI, `Dialog` EMAS: Radix dialogi maksimal
        kenglikka ega va surat uning ichida kichrayib ketardi —
        dalilni ko'rish esa aynan TO'LIQ o'lchamda kerak.
      */}
      {preview ? (
        <button
          type="button"
          aria-label="Yopish"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="max-h-full max-w-full object-contain" />
        </button>
      ) : null}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  JOY
// ═══════════════════════════════════════════════════════════════════

/**
 * ⚠️ KOORDINATA MUHRLANGAN: fuqaro xaritada ko'rsatgan nuqta
 * o'zgarmaydi. `mahallaId` keyin tuzatilishi mumkin, lekin
 * "muammo AYNAN shu yerda edi" degan dalil joyida qoladi
 * (`schema.prisma#Issue`).
 */
export const AppealLocation = ({ issue }: { issue: IssueDetail }) => {
  if (issue.lat === null || issue.lng === null) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm">Fuqaro ko&apos;rsatgan joy</CardTitle>

        {/*
          ⚠️ TASHQI XARITAGA HAVOLA: ijrochi joyga BORISHI kerak va
          unga telefonidagi navigatsiya ilovasi kerak bo'ladi.
          Paneldagi xarita bu savolga javob bermaydi.
        */}
        <a
          href={`https://www.openstreetmap.org/?mlat=${issue.lat}&mlon=${issue.lng}#map=18/${issue.lat}/${issue.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Xaritada ochish
          <ExternalLink className="size-3" />
        </a>
      </CardHeader>

      <CardContent className="space-y-3">
        {issue.address ? (
          <p className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {issue.address}
          </p>
        ) : null}

        {/* ⚠️ BALANDLIK ANIQ: Leaflet ota elementning balandligini
            o'lchaydi va `auto` bo'lsa xarita 0 piksel bo'lib,
            kulrang maydon ko'rinardi. */}
        <div className="h-56 overflow-hidden rounded-xl">
          <MapView
            className="size-full"
            center={[issue.lat, issue.lng]}
            zoom={17}
            markers={[
              {
                id: issue.id,
                lat: issue.lat,
                lng: issue.lng,
                color: issue.category.color ?? "#2563eb",
              },
            ]}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {issue.lat.toFixed(6)}, {issue.lng.toFixed(6)}
        </p>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  FUQARO VA BELGILAR
// ═══════════════════════════════════════════════════════════════════

const FLAGS = [
  {
    key: "isHazard",
    label: "Xavfli holat",
    icon: TriangleAlert,
    className: "bg-destructive/10 text-destructive",
  },
  {
    key: "isLongStanding",
    label: "Uzoq davom etmoqda",
    icon: History,
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  {
    key: "isRepeatAppeal",
    label: "Takroriy murojaat",
    icon: RotateCcw,
    className: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
] as const;

export const AppealCitizen = ({
  citizen,
  issue,
}: {
  citizen: IssueCitizen;
  issue: IssueDetail;
}) => {
  const activeFlags = FLAGS.filter((flag) => issue[flag.key]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Murojaat egasi</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium">
            {[citizen.firstName, citizen.lastName].filter(Boolean).join(" ")}
          </p>
          <p className="text-xs text-muted-foreground">
            {citizen.username ? `@${citizen.username}` : `ID ${citizen.telegramId}`}
          </p>
        </div>

        {citizen.phone ? (
          <div>
            <p className="text-xs text-muted-foreground">Telefon</p>
            {/* ⚠️ `tel:` HAVOLA: operator raqamni qo'lda ko'chirib
                yozishi kerak emas — bu yerda xato qilish oson. */}
            <a href={`tel:${citizen.phone}`} className="text-primary hover:underline">
              {citizen.phone}
            </a>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Faollik bali</span>
          <span className="font-medium tabular-nums">{citizen.points}</span>
        </div>

        {citizen.isBlocked ? (
          <Badge className="bg-destructive/10 text-destructive">
            Hisob cheklangan
          </Badge>
        ) : null}

        {/* ── FUQARO BELGILARI ──────────────────────────────── */}
        {activeFlags.length > 0 ? (
          <div className="space-y-2 border-t pt-3">
            {/*
              ⚠️ "FUQARO AYTDI" DEB YOZILGAN va bu MUHIM: bu
              belgilar TAXMIN, tizimning bahosi emas. Ustuvorlikni
              ular avtomatik o'zgartirmaydi — aks holda
              "shoshilinch" tugmasini har kim bosib, navbat
              ma'nosini yo'qotardi (`mobile.service.ts` izohi).
            */}
            <p className="text-xs text-muted-foreground">
              Fuqaro belgilagan (taxmin — ustuvorlikni o&apos;zgartirmaydi):
            </p>

            <div className="flex flex-wrap gap-1.5">
              {activeFlags.map((flag) => {
                const Icon = flag.icon;
                return (
                  <Badge key={flag.key} className={`gap-1 ${flag.className}`}>
                    <Icon className="size-3" />
                    {flag.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ⚠️ `occurredAt` `createdAt` DAN BOSHQA: murojaat bugun
            yuborilgan bo'lishi, muammo esa bir oy avval
            boshlangan bo'lishi mumkin. */}
        {issue.occurredAt ? (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">Muammo sodir bo&apos;lgan vaqt</p>
            <p>{formatDateTimeUz(issue.occurredAt)}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
