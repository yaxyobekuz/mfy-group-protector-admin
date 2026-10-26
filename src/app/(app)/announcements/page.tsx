"use client";

/**
 * YANGILIKLAR — ilovadagi "Yangiliklar" ro'yxati.
 *
 * ⚠️ NASHR ETILMAGANI (qoralama) ilovada KO'RINMAYDI, lekin panelda
 * ko'rinadi. `districtId` null — butun viloyat bo'yicha.
 */

import { useState } from "react";
import { Megaphone, Pencil, Pin, Plus, Trash2 } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAnnouncements,
  useDeleteAnnouncement,
  type AnnouncementFilters,
} from "@/features/announcements/api";
import { AnnouncementDialog } from "@/features/announcements/editor-dialog";
import { ApiError } from "@/shared/api/client";
import type { Announcement } from "@/shared/api/types";
import { formatDateUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState, ErrorState, CardSkeleton } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";

export default function AnnouncementsPage() {
  const { can } = useSession();
  const [filters] = useState<AnnouncementFilters>({ page: 1, limit: 50 });
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
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 size-4" />
            Yangilik qo&apos;shish
          </Button>
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
          icon={Megaphone}
          title="Hali yangilik yo'q"
          hint="Birinchi yangilikni qo'shing — u fuqarolar ilovasida ko'rinadi."
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
                  ) : (
                    <Badge className="bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                      Qoralama
                    </Badge>
                  )}
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
