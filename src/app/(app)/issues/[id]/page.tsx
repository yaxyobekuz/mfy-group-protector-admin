"use client";

/**
 * MUROJAAT KARTASI.
 *
 * ⚠️ MANBA KO'RSATILADI va bu muhim: signaldan kelgan murojaatda
 * MUALLIF — biriktirgan XODIM, haqiqiy gap egasi esa guruhdagi
 * aholi. Operator bu farqni ko'rmasa, javobni noto'g'ri odamga
 * yo'llardi ("sizning murojaatingiz" deb o'z kasbdoshiga).
 *
 * ⚠️ `resolution` MATNI BOTGA KETADI (botdan kelgan murojaatda) va
 * forma buni AYTADI. Aks holda operator ichki eslatma yozib
 * qo'yardi — va u aholiga ketardi.
 */

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Lock,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAddComment,
  useAssignIssue,
  useIssue,
  useReopenIssue,
  useResolveIssue,
} from "@/features/issues/api";
import { useUsers } from "@/features/users/api";
import { ApiError, fileUrl } from "@/shared/api/client";
import {
  ISSUE_PRIORITY,
  ISSUE_SOURCE,
  ISSUE_STATUS,
  SIGNAL_KIND,
  SIGNAL_SEVERITY,
} from "@/shared/config/labels";
import { formatDateTimeUz, formatDateUz, toInputDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input, Label, Textarea } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CardSkeleton, ErrorState, Spinner } from "@/shared/ui/states";

const NONE = "__none__";
const CLOSED = ["resolved", "rejected"];

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useSession();

  const issue = useIssue(params.id);
  // ⚠️ RUXSAT BO'LMASA XODIMLAR SO'RALMAYDI: `issues.assign` siz
  // ijrochi tanlash tugmasi ko'rinmaydi, ya'ni ro'yxat ham kerak
  // emas va 403 olib konsolni to'ldirmaydi.
  const users = useUsers({ limit: 200 });

  const assign = useAssignIssue();
  const resolve = useResolveIssue();
  const reopen = useReopenIssue();
  const addComment = useAddComment();

  const [resolution, setResolution] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [isPublicComment, setPublicComment] = useState(false);

  if (issue.isLoading) return <CardSkeleton count={3} />;

  if (issue.isError) {
    return (
      <ErrorState
        message={issue.error instanceof ApiError ? issue.error.message : undefined}
        onRetry={() => void issue.refetch()}
      />
    );
  }

  const data = issue.data;
  if (!data) return null;

  const status = ISSUE_STATUS[data.status];
  const priority = ISSUE_PRIORITY[data.priority];
  const source = ISSUE_SOURCE[data.source];
  const isClosed = CLOSED.includes(data.status);

  /** Signaldan kelgan murojaatning manba ma'lumoti. */
  const meta = data.sourceMeta ?? {};
  const messageLink = typeof meta.messageLink === "string" ? meta.messageLink : null;
  const groupTitle = typeof meta.groupTitle === "string" ? meta.groupTitle : null;
  const senderName = typeof meta.senderName === "string" ? meta.senderName : null;

  /**
   * ⚠️ AI TAKLIFI IMZOLANGAN (`sourceMeta.ai`): server uni
   * `signed-ref` bilan tekshirib yozgan — mijoz soxta foiz yoza
   * olmaydi. Faqat `confidence`/`categoryId` ko'rsatiladi.
   */
  const aiRaw = meta.ai;
  const ai =
    aiRaw && typeof aiRaw === "object"
      ? (aiRaw as { confidence?: number; priority?: string })
      : null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="size-4" />
        Orqaga
      </Button>

      {/* ── Sarlavha ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm text-muted-foreground">{data.publicNo}</code>
          <Badge className={status.className}>{status.label}</Badge>
          <Badge className={priority.className}>{priority.label}</Badge>
          <Badge className={source.className}>{source.label}</Badge>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">{data.title}</h1>

        <p className="text-sm text-muted-foreground">
          {data.category.name} · {formatDateTimeUz(data.createdAt)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Asosiy ustun ───────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Murojaat mazmuni</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ⚠️ `whitespace-pre-wrap`: aholi yozgan matnda
                  qator uzilishlari bor va ularsiz hamma gap bir
                  uzun paragrafga qo'shilib ketardi. */}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.body}</p>
            </CardContent>
          </Card>

          {/* ── Ilovadan kelgan dalil (surat/video) ─────────── */}
          {data.attachments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Biriktirilgan fayllar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {data.attachments.map((file) => {
                    const url = fileUrl(file.path);
                    if (!url) return null;
                    return file.kind === "video" ? (
                      <video
                        key={file.id}
                        src={url}
                        controls
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={file.id} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt=""
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ── Ilovadan kelgan murojaat tafsiloti ──────────── */}
          {data.source === "mobile" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ilova ma&apos;lumotlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.citizen ? (
                  <Row
                    label="Yuborgan fuqaro"
                    value={`${data.citizen.firstName} ${data.citizen.lastName ?? ""}`.trim()}
                  />
                ) : null}
                {data.citizen?.phone ? (
                  <Row label="Telefon" value={data.citizen.phone} />
                ) : null}
                {data.address ? <Row label="Manzil" value={data.address} /> : null}
                {data.lat !== null && data.lng !== null ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Xaritada</span>
                    <a
                      className="font-medium text-primary hover:underline"
                      href={`https://www.google.com/maps?q=${data.lat},${data.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {data.lat.toFixed(5)}, {data.lng.toFixed(5)}
                    </a>
                  </div>
                ) : null}
                {data.occurredAt ? (
                  <Row label="Sodir bo'lgan" value={formatDateTimeUz(data.occurredAt)} />
                ) : null}

                {/* ⚠️ FUQARO BAYROQLARI — TAXMIN: ustuvorlikni
                    o'zgartirmaydi, faqat ko'rsatiladi (CLAUDE.md). */}
                {data.isHazard || data.isLongStanding || data.isRepeatAppeal ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {data.isHazard ? (
                      <Badge className="bg-destructive/10 text-destructive">Xavfli</Badge>
                    ) : null}
                    {data.isLongStanding ? (
                      <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        Uzoqdan davom etmoqda
                      </Badge>
                    ) : null}
                    {data.isRepeatAppeal ? (
                      <Badge className="bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                        Takroriy
                      </Badge>
                    ) : null}
                  </div>
                ) : null}

                {ai && typeof ai.confidence === "number" ? (
                  <p className="pt-1 text-xs text-muted-foreground">
                    AI yo&apos;nalishni {ai.confidence}% ishonch bilan taklif qilgan
                    {ai.priority ? ` (${ai.priority})` : ""}.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* ── Manba (signaldan kelgan bo'lsa) ─────────────── */}
          {data.signal || groupTitle ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Manba</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {/*
                  ⚠️ BU QISM NIMA UCHUN BOR: signaldan kelgan
                  murojaatda MUALLIF — biriktirgan xodim, haqiqiy
                  gap egasi esa guruhdagi aholi. Bu ajratish
                  ko'rsatilmasa, javob noto'g'ri odamga yo'llanardi.
                */}
                {groupTitle ? <Row label="Guruh" value={groupTitle} /> : null}
                {senderName ? <Row label="Guruhda yozgan" value={senderName} /> : null}

                {data.signal ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge className={SIGNAL_KIND[data.signal.kind].className}>
                      {SIGNAL_KIND[data.signal.kind].label}
                    </Badge>
                    <Badge className={SIGNAL_SEVERITY[data.signal.severity].className}>
                      AI bahosi: {SIGNAL_SEVERITY[data.signal.severity].label}
                    </Badge>
                  </div>
                ) : null}

                {messageLink ? (
                  <Button variant="outline" size="sm" asChild className="mt-1">
                    <a href={messageLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                      Telegramdagi xabarni ochish
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* ── Yopilgan javob ─────────────────────────────── */}
          {data.resolution ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {data.status === "rejected" ? "Rad etish sababi" : "Javob"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {data.resolution}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.reviewer
                    ? `${data.reviewer.firstName} ${data.reviewer.lastName} · `
                    : ""}
                  {formatDateTimeUz(data.reviewedAt)}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* ── Izohlar ─────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Izohlar {data.comments.length > 0 ? `(${data.comments.length})` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Hali izoh yo&apos;q.</p>
              ) : (
                <div className="space-y-3">
                  {data.comments.map((comment) => (
                    <div key={comment.id} className="space-y-1 border-l-2 pl-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {/* ⚠️ FUQARO QO'SHIMCHASI bo'lsa `user` null. */}
                          {comment.citizen
                            ? `${comment.citizen.firstName} ${comment.citizen.lastName ?? ""} (fuqaro)`.trim()
                            : comment.user
                              ? `${comment.user.firstName} ${comment.user.lastName}`
                              : "—"}
                        </span>
                        <span>{formatDateTimeUz(comment.createdAt)}</span>

                        {/*
                          ⚠️ OMMAVIY IZOH AJRATIB KO'RSATILADI: u
                          botdagi muallifga KETGAN va bu
                          qaytarilmaydi (izoh append-only).
                        */}
                        {comment.isPublic ? (
                          <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                            Muallifga yuborilgan
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Lock className="size-2.5" />
                            Ichki
                          </Badge>
                        )}
                      </div>

                      <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {can("issues.comment") ? (
                <div className="space-y-2 border-t pt-4">
                  <Textarea
                    placeholder="Izoh yozing..."
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    maxLength={4000}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/*
                      ⚠️ CHECKBOX O'RNIGA `Switch` EMAS: bu bir
                      martalik qaror (shu izoh uchun), holat emas.
                      Matn esa OQIBATNI aytadi, maydon nomini emas.
                    */}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isPublicComment}
                        onChange={(event) => setPublicComment(event.target.checked)}
                        className="size-4 rounded border-input"
                        // ⚠️ MUALLIF CHATI YO'Q BO'LSA O'CHIRILGAN:
                        // signaldan kelgan murojaatda javob MFY
                        // guruhiga ketmasligi kerak (bot u yerda
                        // kuzatuvchi) va server `authorChatId` ni
                        // ataylab bo'sh qoldirgan.
                        disabled={data.source === "signal"}
                      />
                      <span
                        className={
                          data.source === "signal" ? "text-muted-foreground" : undefined
                        }
                      >
                        Muallifga ham yuborish
                        {data.source === "signal"
                          ? " (guruhdan kelgan murojaatda mumkin emas)"
                          : ""}
                      </span>
                    </label>

                    <Button
                      size="sm"
                      disabled={commentBody.trim().length < 2 || addComment.isPending}
                      onClick={() =>
                        addComment.mutate(
                          {
                            id: data.id,
                            body: commentBody.trim(),
                            isPublic: isPublicComment,
                          },
                          {
                            onSuccess: () => {
                              setCommentBody("");
                              setPublicComment(false);
                            },
                          },
                        )
                      }
                    >
                      {addComment.isPending ? <Spinner /> : <Send className="size-3.5" />}
                      Qo&apos;shish
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* ── Yon ustun ──────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ma&apos;lumot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label="Hudud"
                value={
                  data.mahalla
                    ? `${data.mahalla.name}, ${data.mahalla.district.name}`
                    : "Belgilanmagan"
                }
              />

              {/* ⚠️ RAIS MA'LUMOTI: muammo bo'yicha kim bilan
                  gaplashish kerakligi darhol ko'rinishi uchun. */}
              {data.mahalla?.chairmanName ? (
                <Row
                  label="MFY raisi"
                  value={`${data.mahalla.chairmanName}${
                    data.mahalla.chairmanPhone ? ` · ${data.mahalla.chairmanPhone}` : ""
                  }`}
                />
              ) : null}

              <Row
                label={data.source === "signal" ? "Biriktirgan" : "Yuborgan"}
                value={
                  // ⚠️ MOBIL MUROJAATDA MUALLIF — FUQARO (`author` null).
                  data.citizen
                    ? `${data.citizen.firstName} ${data.citizen.lastName ?? ""}`.trim()
                    : data.author
                      ? `${data.author.firstName} ${data.author.lastName}`
                      : "—"
                }
              />

              {data.dueAt ? <Row label="Muddat" value={formatDateUz(data.dueAt)} /> : null}
            </CardContent>
          </Card>

          {/* ── Ijrochi ──────────────────────────────────────── */}
          {can("issues.assign") && !isClosed ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ijrochi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={data.assignee?.id ?? NONE}
                  onValueChange={(value) =>
                    assign.mutate({
                      id: data.id,
                      assigneeId: value === NONE ? null : value,
                    })
                  }
                  disabled={assign.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlanmagan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Belgilanmagan —</SelectItem>
                    {users.data?.items
                      .filter((user) => !user.isArchived && user.isActive)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <div className="space-y-1.5">
                  <Label htmlFor="due">Muddat</Label>
                  <Input
                    id="due"
                    type="date"
                    defaultValue={toInputDate(data.dueAt)}
                    onChange={(event) =>
                      assign.mutate({
                        id: data.id,
                        assigneeId: data.assignee?.id ?? null,
                        // ⚠️ BO'SH QIYMAT `null` SIFATIDA ketadi:
                        // `""` serverda `@IsISO8601` da yiqilardi.
                        dueAt: event.target.value
                          ? new Date(event.target.value).toISOString()
                          : null,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Muddat — mo&apos;ljal. Tizim u o&apos;tganda avtomatik hech narsa
                    qilmaydi.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ── Yopish ───────────────────────────────────────── */}
          {can("issues.resolve") ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {isClosed ? "Qayta ochish" : "Yopish"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isClosed ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Qayta ochilganda javob matni tozalanadi — tarix izohlarda
                      qoladi.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => reopen.mutate(data.id)}
                      disabled={reopen.isPending}
                    >
                      {reopen.isPending ? <Spinner /> : <RotateCcw className="size-4" />}
                      Qayta ochish
                    </Button>
                  </>
                ) : (
                  <>
                    <Textarea
                      placeholder="Javob matni..."
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                      maxLength={4000}
                    />

                    {/*
                      ⚠️ OQIBAT AYTILADI: bu matn botdagi muallifga
                      KETADI. Aks holda operator ichki eslatma
                      yozib qo'yardi va u aholiga ketardi.
                    */}
                    <p className="text-xs text-muted-foreground">
                      {data.source === "bot"
                        ? "Bu matn murojaat yuborgan xodimga Telegramda yetib boradi."
                        : "Bu matn tizimda saqlanadi."}{" "}
                      Kamida 10 belgi.
                    </p>

                    <div className="grid gap-2">
                      <Button
                        className="w-full"
                        disabled={resolution.trim().length < 10 || resolve.isPending}
                        onClick={() =>
                          resolve.mutate(
                            { id: data.id, resolution: resolution.trim() },
                            { onSuccess: () => setResolution("") },
                          )
                        }
                      >
                        {resolve.isPending ? (
                          <Spinner />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        Hal qilindi
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={resolution.trim().length < 10 || resolve.isPending}
                        onClick={() =>
                          resolve.mutate(
                            {
                              id: data.id,
                              resolution: resolution.trim(),
                              rejected: true,
                            },
                            { onSuccess: () => setResolution("") },
                          )
                        }
                      >
                        <XCircle className="size-4" />
                        Rad etish
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="shrink-0 text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{value}</span>
  </div>
);
