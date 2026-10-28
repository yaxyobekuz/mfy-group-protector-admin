"use client";

/**
 * FAOL FUQAROLAR REYTINGI (panel).
 *
 * ⚠️ ILOVADAGI REYTING BILAN AYNI RO'YXAT: tartib ham, ball ham
 * bitta manbadan (`Citizen.points`, `server/src/common/points.ts`).
 * Panelda ikkinchi formula yozilsa, fuqaro ilovada 3-o'rinda,
 * panelda 5-o'rinda ko'rinib, qaysi biri to'g'riligini hech kim
 * ayta olmasdi.
 *
 * ⚠️ FARQ — QAMROV: ilovada butun viloyat ro'yxati ochiq, panelda
 * esa xodim o'z hududini ko'radi (`/citizens/rating` serverda
 * `districtScopeWhere` qo'llaydi). Shuning uchun `/mobile/rating`
 * ga murojaat qilinmaydi.
 *
 * ⚠️ BALL "KIM KO'P YOZGAN" EMAS: yuborilganiga 10, hal
 * qilinganiga qo'shimcha 5. Teskarisi bo'lsa, reyting tizimni
 * ma'nosiz murojaatlar bilan to'ldirardi.
 *
 * ⚠️ BU RO'YXAT — RAG'BAT, CHORA EMAS: bu yerda bloklash tugmasi
 * YO'Q (u `Fuqarolar` bo'limida). Reyting qatoridan turib blok
 * qo'yish "ko'p yozgani uchun jazolandi" degan amalni bir bosishga
 * yaqinlashtirardi.
 */

import { useState } from "react";
import Link from "next/link";
import { Trophy, UserCircle } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import { useRating, type RatingFilters } from "@/features/citizens/api";
import { useDistricts } from "@/features/territory/api";
import { ApiError, fileUrl } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
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

/**
 * ⚠️ FAQAT UCHTASI RANGLANADI (ilovada ham shunday): hammasini
 * bo'yash tartibni yo'qotardi — 40-o'rin ham 1-o'rin kabi
 * ko'zga tashlanardi.
 */
const MEDAL: Record<number, string> = {
  1: "bg-amber-400 text-amber-950",
  2: "bg-zinc-300 text-zinc-800",
  3: "bg-orange-400/80 text-orange-950",
};

const LIMITS = [20, 50, 100, 200] as const;

export default function RatingPage() {
  const { can } = useSession();
  const [filters, setFilters] = useState<RatingFilters>({ limit: 50 });

  const rating = useRating(filters);
  const districts = useDistricts();

  // ⚠️ BUTUN-SAHIFA GATE: reyting fuqarolar ma'lumoti, shuning
  // uchun `citizens.view` (yangi ruxsat EMAS — ro'yxat bir xil
  // ma'lumotni ko'rsatadi va ikkinchi ruxsat uni ikkiga bo'lardi).
  if (!can("citizens.view")) {
    return (
      <EmptyState
        icon={Trophy}
        title="Sizda bu bo'limga ruxsat yo'q"
        hint="Ma'muriyatga murojaat qiling."
      />
    );
  }

  const data = rating.data;

  return (
    <>
      <PageHeader title="Reyting" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <StatTile
          label="Faol fuqarolar"
          value={data?.totalActive ?? 0}
          hint="Bali 0 dan yuqori"
          icon={UserCircle}
        />
        <StatTile
          label="Jami ball"
          value={data?.totalPoints ?? 0}
          hint="Murojaat uchun 10, hal qilinganiga +5"
          icon={Trophy}
        />
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <Select
          value={filters.districtId ?? ALL}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              districtId: value === ALL ? undefined : value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tuman" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha tumanlar</SelectItem>
            {districts.data?.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filters.limit ?? 50)}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, limit: Number(value) }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Nechta" />
          </SelectTrigger>
          <SelectContent>
            {LIMITS.map((limit) => (
              <SelectItem key={limit} value={String(limit)}>
                Top {limit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        {rating.isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : rating.isError ? (
          <ErrorState
            message={rating.error instanceof ApiError ? rating.error.message : undefined}
            onRetry={() => void rating.refetch()}
          />
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Reyting hali bo'sh"
            hint="Fuqarolar ilovadan murojaat yuborgach, ball to'plana boshlaydi."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">O&apos;rin</TableHead>
                <TableHead>Fuqaro</TableHead>
                <TableHead>Tuman</TableHead>
                <TableHead className="text-right">Murojaat</TableHead>
                <TableHead className="text-right">Ball</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data?.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg text-sm font-bold tabular-nums",
                        MEDAL[row.rank] ?? "bg-secondary text-muted-foreground",
                      )}
                    >
                      {row.rank}
                    </span>
                  </TableCell>

                  <TableCell>
                    {/*
                      ⚠️ FUQARO SAHIFASIGA HAVOLA: reyting "kim" degan
                      savolni tug'diradi va javob allaqachon bor
                      (`/citizens/:id`). Ikkinchi karta yasash o'sha
                      sahifani takrorlardi.
                    */}
                    <Link
                      href={`/citizens/${row.id}`}
                      className="group flex items-center gap-2.5"
                    >
                      {fileUrl(row.photoUrl) ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={fileUrl(row.photoUrl)!}
                          alt=""
                          loading="lazy"
                          className="size-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                          {row.name.charAt(0) || "?"}
                        </span>
                      )}

                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-primary">
                          {row.name}
                        </span>
                        {row.username ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            @{row.username}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </TableCell>

                  <TableCell className="text-sm">
                    {row.districtName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  <TableCell className="text-right text-sm tabular-nums">
                    {row.appeals}
                  </TableCell>

                  <TableCell className="text-right">
                    <Badge className="bg-primary/10 font-semibold tabular-nums text-primary">
                      {row.points}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
