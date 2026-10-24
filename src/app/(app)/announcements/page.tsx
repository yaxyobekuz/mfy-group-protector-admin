"use client";

/**
 * YANGILIKLAR — mobil ilovaning "Yangiliklar" bo'limi.
 *
 * ⚠️ SAQLASH E'LON QILMAYDI. Yangilik QORALAMA bo'lib yaratiladi
 * va "E'lon qilish" — ALOHIDA amal. Aks holda yarim yozilgan
 * matn bitta tasodifiy bosishda butun viloyatga chiqib ketardi
 * (`announcements.service.ts` qoidasi).
 *
 * ⚠️ E'LON MFY GURUHIGA YUBORILMAYDI: bot guruhda hech narsa
 * yozmaydi (ildizdagi `CLAUDE.md`). Yangilik faqat ILOVADA
 * ko'rinadi va bu ekranda shu aytiladi.
 */

import {
  Eye,
  ImagePlus,
  Newspaper,
  Pencil,
  Pin,
  Plus,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  useAnnouncements,
  useDeleteAnnouncement,
  usePublishAnnouncement,
  useSaveAnnouncement,
  useUploadCover,
} from "@/features/announcements/api";
import { useDistricts } from "@/features/territory/api";
import { useSession } from "@/entities/session/auth-provider";
import { fileUrl } from "@/shared/api/client";
import type { Announcement } from "@/shared/api/types";
import { formatDateTimeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input, Label, Textarea } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { CardSkeleton, EmptyState, ErrorState } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";

/** ⚠️ `Select` bo'sh satrni qabul qilmaydi — "viloyat" uchun kalit. */
const PROVINCE = "__province__";
const ALL = "__all__";

interface DraftState {
  id?: string;
  title: string;
  body: string;
  districtId: string;
  coverKey: string | null;
  coverUrl: string | null;
  isPinned: boolean;
}

const EMPTY_DRAFT: DraftState = {
  title: "",
  body: "",
  districtId: PROVINCE,
  coverKey: null,
  coverUrl: null,
  isPinned: false,
};

export default function AnnouncementsPage() {
  const { can, isProvinceWide } = useSession();

  const [filter, setFilter] = useState<string>(ALL);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [removing, setRemoving] = useState<Announcement | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const districts = useDistricts();
  const upload = useUploadCover();
  const save = useSaveAnnouncement();
  const publish = usePublishAnnouncement();
  const remove = useDeleteAnnouncement();

  const { data, isLoading, isError, error, refetch } = useAnnouncements({
    published: filter === ALL ? undefined : filter === "yes",
    limit: 100,
  });

  const canManage = can("announcements.manage");

  const openEditor = (item?: Announcement) => {
    setDraft(
      item
        ? {
            id: item.id,
            title: item.title,
            body: item.body,
            districtId: item.district?.id ?? PROVINCE,
            // ⚠️ `coverKey` SERVERDAN KELMAYDI (faqat `coverUrl`):
            // tahrirlashda rasm O'ZGARTIRILMASA, `coverKey`
            // yuborilmaydi va server mavjud qiymatga TEGMAYDI.
            coverKey: null,
            coverUrl: item.coverUrl,
            isPinned: item.isPinned,
          }
        : { ...EMPTY_DRAFT },
    );
  };

  return (
    <div>
      <PageHeader
        title="Yangiliklar"
        actions={
          canManage ? (
            <Button onClick={() => openEditor()}>
              <Plus className="size-4" />
              Yangilik yozish
            </Button>
          ) : null
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            {/* ⚠️ QOIDA EKRANDA AYTILADI: "nega guruhga chiqmadi"
                degan savol aks holda qo'llab-quvvatlashga
                tushardi. */}
            Yangiliklar faqat <strong className="font-medium">mobil ilovada</strong>{" "}
            ko&apos;rinadi — MFY guruhlariga yuborilmaydi.
          </p>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[12rem]">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              <SelectItem value="yes">E&apos;lon qilingan</SelectItem>
              <SelectItem value="no">Qoralama</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <CardSkeleton count={3} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => void refetch()} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Yangilik yo'q"
          hint="Ilovadagi fuqarolarga e'lon, natija yoki eslatma yozing."
          action={
            canManage ? (
              <Button onClick={() => openEditor()}>Yangilik yozish</Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3">
          {data!.items.map((item) => {
            const cover = fileUrl(item.coverUrl);

            return (
              <Card key={item.id}>
                <CardContent className="flex gap-4 p-4">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="hidden size-24 shrink-0 rounded-xl object-cover sm:block"
                    />
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          item.isPublished
                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }
                      >
                        {item.isPublished ? "E'lon qilingan" : "Qoralama"}
                      </Badge>

                      {item.isPinned ? (
                        <Badge className="bg-accent text-accent-foreground">
                          <Pin className="mr-1 size-3" />
                          Tepada
                        </Badge>
                      ) : null}

                      <Badge className="bg-secondary text-secondary-foreground">
                        {item.district?.name ?? "Butun viloyat"}
                      </Badge>

                      {item.isPublished ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="size-3" />
                          {item.viewCount}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-2 font-semibold">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.body}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.isPublished && item.publishedAt
                        ? `E'lon qilindi: ${formatDateTimeUz(item.publishedAt)}`
                        : `Yaratildi: ${formatDateTimeUz(item.createdAt)}`}
                      {item.author
                        ? ` · ${item.author.firstName} ${item.author.lastName}`
                        : ""}
                    </p>
                  </div>

                  {canManage ? (
                    <div className="flex shrink-0 flex-col gap-2">
                      <Button
                        size="sm"
                        variant={item.isPublished ? "outline" : "default"}
                        disabled={publish.isPending}
                        onClick={() =>
                          publish.mutate({ id: item.id, publish: !item.isPublished })
                        }
                      >
                        {item.isPublished ? (
                          <>
                            <Undo2 className="size-4" />
                            Qoralamaga
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            E&apos;lon qilish
                          </>
                        )}
                      </Button>

                      <Button size="sm" variant="ghost" onClick={() => openEditor(item)}>
                        <Pencil className="size-4" />
                        Tahrirlash
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setRemoving(item)}
                      >
                        <Trash2 className="size-4" />
                        O&apos;chirish
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── MUHARRIR ────────────────────────────────────────── */}
      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Yangilikni tahrirlash" : "Yangi yangilik"}
            </DialogTitle>
            <DialogDescription>
              {/* ⚠️ "SAQLASH ≠ E'LON QILISH" SHU YERDA AYTILADI. */}
              Saqlangan yangilik <strong>qoralama</strong> bo&apos;lib qoladi —
              ilovada ko&apos;rinishi uchun uni alohida e&apos;lon qilasiz.
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Sarlavha</Label>
                <Input
                  id="title"
                  value={draft.title}
                  maxLength={200}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Matn</Label>
                <Textarea
                  id="body"
                  value={draft.body}
                  rows={8}
                  maxLength={10_000}
                  onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Kimga ko&apos;rinadi</Label>
                  <Select
                    value={draft.districtId}
                    onValueChange={(value) => setDraft({ ...draft, districtId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* ⚠️ TUMAN XODIMIDA "BUTUN VILOYAT" YO'Q:
                          server uni baribir rad etardi va tanlov
                          ko'rinib turib ishlamasligi eng yomon
                          holat. */}
                      {isProvinceWide ? (
                        <SelectItem value={PROVINCE}>Butun viloyat</SelectItem>
                      ) : null}
                      {(districts.data ?? []).map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Muqova rasmi</Label>

                  {draft.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileUrl(draft.coverUrl)!}
                      alt=""
                      className="h-24 w-full rounded-xl object-cover"
                    />
                  ) : null}

                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={upload.isPending}
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus className="size-4" />
                    {draft.coverUrl ? "Almashtirish" : "Rasm yuklash"}
                  </Button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;

                      upload.mutate(file, {
                        onSuccess: (result) =>
                          setDraft((prev) =>
                            prev
                              ? { ...prev, coverKey: result.coverKey, coverUrl: result.url }
                              : prev,
                          ),
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Ilovada tepada ko&apos;rsatish</p>
                  <p className="text-xs text-muted-foreground">
                    Muhim e&apos;lonlar ro&apos;yxat boshida turadi
                  </p>
                </div>
                <Switch
                  checked={draft.isPinned}
                  onCheckedChange={(checked) =>
                    setDraft({ ...draft, isPinned: checked })
                  }
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Bekor qilish
            </Button>
            <Button
              disabled={
                !draft ||
                draft.title.trim().length < 3 ||
                draft.body.trim().length < 10 ||
                save.isPending
              }
              onClick={() => {
                if (!draft) return;

                save.mutate(
                  {
                    id: draft.id,
                    title: draft.title.trim(),
                    body: draft.body.trim(),
                    districtId:
                      draft.districtId === PROVINCE ? null : draft.districtId,
                    // ⚠️ FAQAT YANGI RASM YUBORILADI: `undefined`
                    // bo'lsa server mavjud muqovaga TEGMAYDI
                    // (`announcements.service.ts#update`).
                    ...(draft.coverKey ? { coverKey: draft.coverKey } : {}),
                    isPinned: draft.isPinned,
                  },
                  { onSuccess: () => setDraft(null) },
                );
              }}
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── O'CHIRISH TASDIG'I ──────────────────────────────── */}
      <Dialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangilikni o&apos;chirish</DialogTitle>
            <DialogDescription>
              {/* ⚠️ QAYTARIB BO'LMASLIGI AYTILADI: `Issue` dan
                  farqli o'laroq bu QATTIQ o'chirish
                  (`announcements.service.ts#remove` izohi). */}
              &laquo;{removing?.title}&raquo; butunlay o&apos;chiriladi va uni
              tiklab bo&apos;lmaydi.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(removing!.id, { onSuccess: () => setRemoving(null) })
              }
            >
              <Trash2 className="size-4" />
              O&apos;chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
