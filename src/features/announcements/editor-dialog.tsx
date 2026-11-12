"use client";

/**
 * YANGILIK TAHRIRLASH OYNASI — yaratish va o'zgartirish.
 *
 * ⚠️ "NASHR ETISH" ALOHIDA BAYROQ: qoralama saqlab, keyin nashr qilish
 * mumkin. Nashr etilmagani ilovada ko'rinmaydi.
 *
 * ⚠️ NASHR VA REJA — BITTA TANLOV (uch holat), ikki mustaqil
 * o'zgartirgich EMAS: ikkisi QARAMA-QARSHI buyruq ("hoziroq chiqar"
 * va "ertaga chiqar") va server ularni birga qabul qilmaydi. Ikki
 * o'zgartirgich bo'lsa, xodim ikkisini ham yoqib, saqlashda xato
 * olardi — sababini esa tushunmasdi.
 *
 * ⚠️ FAYL DARHOL YUKLANADI, "Saqlash" da emas: xodim 10 ta surat
 * tanlab, keyin saqlash tugmasini bosganda oyna o'n soniya qotib
 * turardi va u "ishlamadi" deb yana bosardi.
 *
 * ⚠️ MEDIA QO'SHILADI, ALMASHTIRILMAYDI: mavjud fayllarda token
 * YO'Q (imzo faqat yuklash paytida beriladi), ya'ni ularni
 * qaytarib yuborib bo'lmaydi. O'chirish ALOHIDA va id bo'yicha
 * (`removeMedia`).
 */

import { useRef, useState } from "react";
import { Film, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import {
  uploadAnnouncementFile,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from "@/features/announcements/api";
import { useDistricts } from "@/features/territory/api";
import { ApiError, fileUrl } from "@/shared/api/client";
import type { Announcement } from "@/shared/api/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input, Label, Textarea } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { Spinner } from "@/shared/ui/states";

const PROVINCE = "__province__";

/** Eng ko'p fayl — server ham shu songa cheklaydi (`ArrayMaxSize`). */
const MAX_MEDIA = 10;

/**
 * NASHR HOLATI — UCH QIYMAT.
 *
 * ⚠️ `boolean` YETARLI EMAS: "qoralama", "hoziroq nashr" va
 * "rejalashtirilgan" — UCH holat va ikkisi bir vaqtda bo'la
 * olmaydi.
 */
type PublishMode = "draft" | "now" | "schedule";

/** Yangi yuklangan fayl — token va ko'rsatish uchun manzil. */
interface PendingMedia {
  token: string;
  url: string;
  kind: "photo" | "video";
}

/** Toshkent devor-soati UTC dan necha soat oldinda. */
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/**
 * ISO SANADAN `<input type="datetime-local">` QIYMATI.
 *
 * ⚠️ `toISOString()` YAKKA ISHLATILMAYDI: u UTC beradi va maydon
 * TOSHKENT devor-soatini kutadi — natijada ekranda reja besh
 * soat orqaga surilib ko'rinardi. `date.ts` dagi qoida bilan ayni
 * sabab: muhit zonasiga tayanmaslik kerak, siljish QO'LDA
 * qo'shiladi.
 */
const toLocalInput = (iso: string): string =>
  new Date(new Date(iso).getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 16);

/**
 * MAYDON QIYMATIDAN ISO SANA.
 *
 * ⚠️ TESKARI ALMASHTIRISH: maydon Toshkent vaqtini beradi
 * (`2026-11-13T09:00`), server esa ISO kutadi. Siljish
 * ayrilmasa, "ertalab 9" serverda 14:00 bo'lib tushardi.
 */
const fromLocalInput = (value: string): string =>
  new Date(new Date(`${value}:00Z`).getTime() - TASHKENT_OFFSET_MS).toISOString();

interface Props {
  announcement: Announcement | null;
  onClose: () => void;
}

export const AnnouncementDialog = ({ announcement, onClose }: Props) => {
  const editing = Boolean(announcement);
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const districts = useDistricts();

  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [districtId, setDistrictId] = useState(announcement?.districtId ?? null);
  const [isPinned, setIsPinned] = useState(announcement?.isPinned ?? false);

  const [mode, setMode] = useState<PublishMode>(() => {
    if (announcement?.publishedAt) return "now";
    if (announcement?.scheduledAt) return "schedule";
    // ⚠️ YANGI E'LON STANDART HOLDA NASHR ETILADI (eski xulq
    // saqlanadi): xodim e'lon yozib, uni chiqarishni alohida
    // eslab qolishi kerak bo'lmasin.
    return editing ? "draft" : "now";
  });

  const [scheduledAt, setScheduledAt] = useState(
    announcement?.scheduledAt ? toLocalInput(announcement.scheduledAt) : "",
  );

  /**
   * MEDIA — UCH RO'YXAT.
   *
   * ⚠️ MAVJUDLARI, O'CHIRILADIGANLARI VA YANGILARI ALOHIDA
   * yuritiladi, chunki server uchun ham ular boshqa-boshqa:
   * yangilari TOKEN bilan qo'shiladi, o'chiriladiganlari ID
   * bilan olib tashlanadi. Bitta ro'yxatga yig'ilsa, mavjud
   * fayl uchun token o'ylab topish kerak bo'lardi — u esa
   * yo'q.
   */
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [newMedia, setNewMedia] = useState<PendingMedia[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  const existing = (announcement?.media ?? []).filter(
    (item) => !removedIds.includes(item.id),
  );

  const pending = create.isPending || update.isPending;

  const canSave =
    title.trim().length >= 3 &&
    body.trim().length >= 3 &&
    // ⚠️ REJA TANLANGANDA SANA MAJBURIY: bo'sh qoldirilsa, server
    // e'lonni oddiy qoralama qilib saqlardi va xodim uni
    // "rejalashtirdim" deb o'ylab yurardi.
    (mode !== "schedule" || scheduledAt.length > 0) &&
    // ⚠️ YUKLASH TUGAMAGUNICHA SAQLANMAYDI: aks holda hali token
    // olmagan fayl e'longa tushmay qolardi.
    !uploading;

  const handlePick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const room = MAX_MEDIA - existing.length - newMedia.length;

    if (room <= 0) {
      toast.error(`Eng ko'pi ${MAX_MEDIA} ta fayl`);
      return;
    }

    setUploading(true);

    try {
      /**
       * ⚠️ KETMA-KET, PARALLEL EMAS: 10 ta video birga
       * yuborilsa, brauzer ham, server ham bir vaqtda 250 MB
       * bilan ishlashga majbur bo'lardi.
       */
      for (const file of Array.from(files).slice(0, room)) {
        const result = await uploadAnnouncementFile(file);
        setNewMedia((previous) => [...previous, result]);
      }
    } catch (error) {
      // ⚠️ SERVER MATNI KO'RSATILADI: u "Fayl turi qabul
      // qilinmaydi" kabi ANIQ sababni aytadi (`uploads.service`).
      toast.error(error instanceof ApiError ? error.message : "Fayl yuklanmadi");
    } finally {
      setUploading(false);
      // ⚠️ MAYDON TOZALANADI: aks holda ayni faylni qayta tanlash
      // hodisa chiqarmasdi (brauzer "o'zgarmadi" deb hisoblaydi).
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleSave = () => {
    const payload = {
      title: title.trim(),
      body: body.trim(),
      districtId: districtId ?? undefined,
      isPinned,
      publish: mode === "now",
      ...(mode === "schedule" && scheduledAt
        ? { scheduledAt: fromLocalInput(scheduledAt) }
        : {}),
      /**
       * ⚠️ REJA BEKOR QILINGANI ANIQ AYTILADI: e'lon avval
       * rejalashtirilgan bo'lib, xodim uni qoralamaga qaytargan
       * bo'lsa, server `scheduledAt` ni o'zi tozalay olmaydi
       * (`undefined` — "tegilmadi").
       */
      ...(mode !== "schedule" && announcement?.scheduledAt
        ? { cancelSchedule: true }
        : {}),
      ...(newMedia.length > 0 ? { media: newMedia.map((item) => item.token) } : {}),
      ...(removedIds.length > 0 ? { removeMedia: removedIds } : {}),
    };

    if (announcement) {
      update.mutate({ id: announcement.id, ...payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Yangilikni tahrirlash" : "Yangi yangilik"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Sarlavha</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Masalan: Suv ta'minoti vaqtincha to'xtatiladi"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Matn</Label>
            <Textarea
              id="body"
              rows={6}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Yangilik matni..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Hudud</Label>
            <Select
              value={districtId ?? PROVINCE}
              onValueChange={(value) => setDistrictId(value === PROVINCE ? null : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROVINCE}>Butun viloyat</SelectItem>
                {districts.data?.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Yuqoriga qadash</Label>
              <p className="text-xs text-muted-foreground">Ro&apos;yxat boshida turadi</p>
            </div>
            <Switch checked={isPinned} onCheckedChange={setIsPinned} />
          </div>

          {/* ══ MEDIA ════════════════════════════════════════ */}
          <div className="space-y-2">
            <Label>Surat va video</Label>

            {existing.length > 0 || newMedia.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {existing.map((item) => (
                  <MediaThumb
                    key={item.id}
                    url={item.url}
                    kind={item.kind}
                    onRemove={() => setRemovedIds((previous) => [...previous, item.id])}
                  />
                ))}

                {newMedia.map((item) => (
                  <MediaThumb
                    key={item.token}
                    url={item.url}
                    kind={item.kind}
                    onRemove={() =>
                      setNewMedia((previous) =>
                        previous.filter((candidate) => candidate.token !== item.token),
                      )
                    }
                  />
                ))}
              </div>
            ) : null}

            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/mp4,video/quicktime"
              multiple
              hidden
              onChange={(event) => void handlePick(event.target.files)}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || existing.length + newMedia.length >= MAX_MEDIA}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? (
                <Spinner className="mr-1.5 size-4" />
              ) : (
                <ImagePlus className="mr-1.5 size-4" />
              )}
              {uploading ? "Yuklanmoqda..." : "Fayl qo'shish"}
            </Button>

            {/*
              ⚠️ CHEGARA VA TUR OLDINDAN AYTILADI: server
              `.pdf` ni rad etadi va sabab "Fayl turi qabul
              qilinmaydi" bo'lardi — xodim nimani yuklash
              mumkinligini oldin bilishi kerak.
            */}
            <p className="text-xs text-muted-foreground">
              Surat yoki qisqa video, eng ko&apos;pi {MAX_MEDIA} ta. Fayl
              tanlangan zahoti yuklanadi.
            </p>
          </div>

          {/* ══ NASHR ════════════════════════════════════════ */}
          <div className="space-y-1.5">
            <Label>Nashr</Label>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as PublishMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Hoziroq nashr etish</SelectItem>
                <SelectItem value="schedule">Belgilangan vaqtda</SelectItem>
                <SelectItem value="draft">Qoralama</SelectItem>
              </SelectContent>
            </Select>

            {mode === "draft" ? (
              <p className="text-xs text-muted-foreground">
                Ilovada ko&apos;rinmaydi.
              </p>
            ) : null}

            {mode === "schedule" ? (
              <div className="space-y-1.5 pt-2">
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
                {/*
                  ⚠️ NIMA UCHUN KERAKLIGI AYTILADI: aks holda
                  xodim "qoralama bilan nima farqi bor" deb
                  o'ylardi. Va aniqlik ham aytiladi — server
                  daqiqada bir marta tekshiradi.
                */}
                <p className="text-xs text-muted-foreground">
                  Toshkent vaqti. E&apos;lon o&apos;sha daqiqada
                  avtomatik chiqadi — kompyuter oldida turish shart
                  emas.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Bekor qilish
          </Button>
          <Button disabled={!canSave || pending} onClick={handleSave}>
            {pending ? <Spinner className="mr-1.5 size-4" /> : null}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * MEDIA NISHONI.
 *
 * ⚠️ VIDEO UCHUN `<video>` QO'YILMAYDI: oynada 10 ta video
 * elementi bo'lsa, brauzer har biri uchun oqim ochib, oynani
 * sezilarli sekinlashtirardi. Belgi yetarli — xodim faylni
 * o'zi tanlagan va u nima ekanini biladi.
 */
const MediaThumb = ({
  url,
  kind,
  onRemove,
}: {
  url: string;
  kind: "photo" | "video";
  onRemove: () => void;
}) => (
  <div className="group relative size-20 overflow-hidden rounded-md border bg-muted">
    {kind === "photo" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fileUrl(url) ?? ""}
        alt=""
        className="size-full object-cover"
      />
    ) : (
      <div className="flex size-full items-center justify-center">
        <Film className="size-6 text-muted-foreground" />
      </div>
    )}

    <button
      type="button"
      onClick={onRemove}
      aria-label="Olib tashlash"
      className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
    >
      <X className="size-3.5" />
    </button>
  </div>
);
