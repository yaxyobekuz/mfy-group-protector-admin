"use client";

/**
 * MUROJAATLAR — rasmiy navbat.
 *
 * ⚠️ JADVALDA KO'RSATILADI, kartada emas (signallardan farqli).
 * Sabab: murojaatda sarlavha QISQA, muhim narsa esa
 * holat/ijrochi/muddat — ya'ni ustunlar. Signalda esa asosiy mazmun
 * MATN va u jadval yacheykasiga sig'masdi.
 *
 * ⚠️ `source` USTUNI BOR: "AI topdi" va "odam yubordi" ni ajratib
 * ko'rsatish AI'ning foydasini baholashning yagona yo'li.
 */

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ImageIcon,
  MapPin,
  MessageSquare,
  MessageSquareWarning,
  TriangleAlert,
} from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAllCategories,
  useIssueStats,
  useIssues,
  type IssueFilters,
} from "@/features/issues/api";
import { useMahallas } from "@/features/territory/api";
import { ApiError } from "@/shared/api/client";
import type { IssuePriority, IssueSource, IssueStatus } from "@/shared/api/types";
import {
  ISSUE_PRIORITY,
  ISSUE_SOURCE,
  ISSUE_STATUS,
} from "@/shared/config/labels";
import { formatDateUz, formatRelativeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { EmptyState, ErrorState, TableSkeleton } from "@/shared/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { PageHeader } from "@/widgets/page-header/page-header";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

const ALL = "__all__";

export default function IssuesPage() {
  const { can } = useSession();
  const searchParams = useSearchParams();

  /**
   * ⚠️ BOSHLANG'ICH FILTR URL'DAN O'QILADI: boshqaruv panelidagi
   * plitkalar `/issues?overdue=true` kabi havola beradi va
   * foydalanuvchi o'sha kesimni KO'RISHI kerak. O'qilmasa, havola
   * shunchaki to'liq ro'yxatni ochardi.
   */
  const [filters, setFilters] = useState<IssueFilters>(() => ({
    status: (searchParams.get("status") as IssueStatus | null) ?? undefined,
    overdue: searchParams.get("overdue") === "true" ? true : undefined,
    page: 1,
    limit: 50,
  }));

  const issues = useIssues(filters);
  const stats = useIssueStats();
  const categories = useAllCategories();
  const mahallas = useMahallas();

  const patch = (next: Partial<IssueFilters>) =>
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));

  return (
    <>
      <PageHeader
        title="Murojaatlar"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Ochiq"
          value={stats.data?.open ?? "—"}
          icon={MessageSquareWarning}
        />
        <StatTile
          label="Muddati o'tgan"
          value={stats.data?.overdue ?? "—"}
          icon={AlertTriangle}
          tone={stats.data?.overdue ? "danger" : "default"}
        />
        <StatTile label="Hal qilindi" value={stats.data?.resolved ?? "—"} tone="success" />
        <StatTile
          label="Hududi belgilanmagan"
          value={stats.data?.unassignedMahalla ?? "—"}
          tone={stats.data?.unassignedMahalla ? "warning" : "default"}
          hint="Hisobotga tushmaydi"
        />
      </div>

      {/* ── Filtrlar ─────────────────────────────────────────── */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          placeholder="Raqam, sarlavha, matn..."
          value={filters.search ?? ""}
          onChange={(event) => patch({ search: event.target.value || undefined })}
        />

        <Select
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            patch({ status: value === ALL ? undefined : (value as IssueStatus) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha holatlar</SelectItem>
            {Object.entries(ISSUE_STATUS).map(([value, def]) => (
              <SelectItem key={value} value={value}>
                {def.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.source ?? ALL}
          onValueChange={(value) =>
            patch({ source: value === ALL ? undefined : (value as IssueSource) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Manba" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha manbalar</SelectItem>
            {Object.entries(ISSUE_SOURCE).map(([value, def]) => (
              <SelectItem key={value} value={value}>
                {def.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId ?? ALL}
          onValueChange={(value) =>
            patch({ categoryId: value === ALL ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Yo'nalish" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha yo&apos;nalishlar</SelectItem>
            {categories.data?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
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
            <SelectValue placeholder="MFY" />
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
      </div>

      {filters.overdue ? (
        <div className="mb-4 flex items-center gap-2">
          <Badge className="bg-destructive/10 text-destructive">
            Faqat muddati o&apos;tganlar
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => patch({ overdue: undefined })}
          >
            Filtrni olib tashlash
          </Button>
        </div>
      ) : null}

      {/* ── Jadval ───────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        {issues.isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : issues.isError ? (
          <ErrorState
            message={issues.error instanceof ApiError ? issues.error.message : undefined}
            onRetry={() => void issues.refetch()}
          />
        ) : (issues.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={MessageSquareWarning}
            title="Murojaat topilmadi"
            hint={
              filters.search || filters.status || filters.source || filters.categoryId
                ? "Filtrlarni kengaytirib ko'ring."
                : "Signallar bo'limida AI topgan gaplarni murojaatga aylantiring, yoki xodimlar botdan yuborishini kutib turing."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Raqam / sarlavha</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Manba</TableHead>
                <TableHead>Hudud</TableHead>
                <TableHead>Ijrochi</TableHead>
                <TableHead>Muddat</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {issues.data?.items.map((issue) => {
                const status = ISSUE_STATUS[issue.status];
                const source = ISSUE_SOURCE[issue.source];
                const priority = ISSUE_PRIORITY[issue.priority];

                return (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <Link href={`/issues/${issue.id}`} className="group block space-y-0.5">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-muted-foreground">
                            {issue.publicNo}
                          </code>
                          {/* ⚠️ MUHIMLIK FAQAT ODDIYDAN YUQORIDA
                              ko'rsatiladi: "Oddiy" yorlig'i hamma
                              qatorda takrorlanib, shovqin bo'lardi. */}
                          {issue.priority !== "normal" && issue.priority !== "low" ? (
                            <Badge className={priority.className}>{priority.label}</Badge>
                          ) : null}
                          {issue.commentCount > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                              <MessageSquare className="size-3" />
                              {issue.commentCount}
                            </span>
                          ) : null}

                          {/*
                            ⚠️ SURAT VA JOY BELGISI RO'YXATDA:
                            dalili bor murojaatni ochib ko'rishdan
                            OLDIN ajratib olish kerak — operator
                            navbatni shunga qarab tartiblaydi.
                          */}
                          {issue.attachmentCount > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                              <ImageIcon className="size-3" />
                              {issue.attachmentCount}
                            </span>
                          ) : null}

                          {issue.hasLocation ? (
                            <MapPin className="size-3 text-muted-foreground" />
                          ) : null}

                          {/*
                            ⚠️ "FUQARO XAVFLI DEDI" — TAXMIN, tizim
                            bahosi EMAS (`mobile.service.ts`
                            izohi). Shuning uchun u USTUVORLIK
                            yorlig'idan boshqa ko'rinishda —
                            faqat belgi.
                          */}
                          {issue.isHazard ? (
                            <TriangleAlert
                              className="size-3 text-destructive"
                              aria-label="Fuqaro xavfli deb belgilagan"
                            />
                          ) : null}
                        </div>

                        <p className="font-medium group-hover:text-primary">
                          {issue.title}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {issue.category.name} · {formatRelativeUz(issue.createdAt)}
                        </p>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <Badge className={status.className}>{status.label}</Badge>
                    </TableCell>

                    <TableCell>
                      <Badge className={source.className}>{source.label}</Badge>
                    </TableCell>

                    <TableCell className="text-sm">
                      {issue.mahalla ? (
                        <div>
                          <p>{issue.mahalla.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {issue.mahalla.district.name}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          Belgilanmagan
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {issue.assignee ? (
                        `${issue.assignee.firstName} ${issue.assignee.lastName}`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {issue.dueAt ? (
                        <span
                          className={
                            issue.isOverdue
                              ? "font-medium text-destructive"
                              : undefined
                          }
                        >
                          {formatDateUz(issue.dueAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {issues.data && issues.data.total > issues.data.limit ? (
        <div className="flex items-center justify-between pt-3">
          <p className="text-xs text-muted-foreground">
            {issues.data.total} ta murojaat · {issues.data.page}-sahifa
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={issues.data.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            >
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!issues.data.hasMore}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
            >
              Keyingi
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
