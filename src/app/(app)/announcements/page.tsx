"use client";

/**
 * YANGILIKLAR — ilovadagi "Yangiliklar" ro'yxati.
 *
 * ⚠️ NASHR ETILMAGANI (qoralama) ilovada KO'RINMAYDI, lekin panelda
 * ko'rinadi. `districtId` null — butun viloyat bo'yicha.
 *
 * ⚠️ REJALASHTIRILGANI QORALAMADAN AJRATILADI: ikkisi ham
 * "nashr etilmagan", lekin biri O'ZI chiqadi, ikkinchisi esa
 * xodimni KUTADI. Bir xil ko'rsatilsa, rejalashtirilgan e'lon
 * ro'yxatda unutilib, keyin "o'zi chiqib ketgani" kutilmagan
 * bo'lardi — yoki teskarisi, qoralama abadiy kutilardi.
 */

import { useState } from "react";
import { Clock, Image as ImageIcon, Megaphone, Pencil, Pin, Plus, Trash2 } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAnnouncements,
  useDeleteAnnouncement,
  type AnnouncementFilters,
} from "@/features/announcements/api";
import { AnnouncementDialog } from "@/features/announcements/editor-dialog";
import { ApiError } from "@/shared/api/client";
import type { Announcement } from "@/shared/api/types";
import { formatDateTimeUz, formatDateUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState, ErrorState, CardSkeleton } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";

export default function AnnouncementsPage() {
  const { can } = useSession();
  const [scheduledOnly, setScheduledOnly] = useState(false);

  /**
   * ⚠️ FILTR HOLATDA, URL DA EMAS: bu bitta o'zgartirgich va
   * sahifa boshqa joydan ochilmaydi — URL ga chiqarish
   * foyda bermasdi (murojaatlar ro'yxatidan farqli, u yerda
   * havola ulashiladi).
   */
  const filters: AnnouncementFilters = {
    page: 1,
    limit: 50,
    ...(scheduledOnly ? { scheduledOnly: true } : {}),
  };
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [creating, setCreating] = useState(false);

  const announcements = useAnnouncements(filters);
  const remove = useDeleteAnnouncement();

  if (!can("announcements.manage")) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Sizda bu bo'limga ruxsat yo'q"
        hint="Ma'muriyatga murojaat qiling."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Yangiliklar"
        actions={
          <div className="flex gap-2">
            {/*
              ⚠️ "KUTAYOTGANLAR" ALOHIDA KESIM: xodim ertalabga
              qo'ygan e'lonini tekshirishi kerak va umumiy
              ro'yxatda u qoralamalar orasida ko'rinmay ketardi.
            */}
            <Button
              variant={scheduledOnly ? "default" : "outline"}
              onClick={() => setScheduledOnly((previous) => !previous)}
            >
              <Clock className="mr-1.5 size-4" />
              Kutayotganlar
            </Button>

            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 size-4" />
              Yangilik qo&apos;shish
            </Button>
          </div>
        }
      />

      {announcements.isLoading ? (
        <CardSkeleton count={4} />
      ) : announcements.isError ? (
        <ErrorState
          message={
            announcements.error instanceof ApiError ? announcements.error.message : undefined
          }
          onRetry={() => void announcements.refetch()}
        />
      ) : (announcements.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={scheduledOnly ? Clock : Megaphone}
          title={scheduledOnly ? "Kutayotgan e'lon yo'q" : "Hali yangilik yo'q"}
          hint={
            scheduledOnly
              ? "Rejalashtirilgan e'lonlar shu yerda turadi — belgilangan vaqtda o'zi chiqadi."
              : "Birinchi yangilikni qo'shing — u fuqarolar ilovasida ko'rinadi."
          }
        />
      ) : (
        <div className="space-y-3">
          {announcements.data?.items.map((item) => (
            <Card key={item.id} className="flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {item.isPinned ? (
                    <Pin className="size-3.5 text-primary" />
                  ) : null}
                  <p className="font-medium">{item.title}</p>
                  {item.publishedAt ? (
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Nashr etilgan
                    </Badge>
                  ) : item.scheduledAt ? (
                    /*
                      ⚠️ UCHINCHI HOLAT ALOHIDA RANGDA: "qoralama"
                      bilan bir xil ko'rsatilsa, xodim e'lonning
                      o'zi chiqishini bilmasdi.
                    */
                    <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                      <Clock className="mr-1 size-3" />
                      {formatDateTimeUz(item.scheduledAt)}
                    </Badge>
                  ) : (
                    <Badge className="bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                      Qoralama
                    </Badge>
                  )}

                  {item.media.length > 0 ? (
                    <Badge className="bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <ImageIcon className="mr-1 size-3" />
                      {item.media.length}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {item.districtName ?? "Butun viloyat"} ·{" "}
                  {item.publishedAt ? formatDateUz(item.publishedAt) : "—"} · {item.viewCount}{" "}
                  ko&apos;rildi
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(item)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (confirm("Bu yangilikni o'chirishni tasdiqlaysizmi?")) {
                      remove.mutate(item.id);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating || editing ? (
        <AnnouncementDialog
          announcement={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}
