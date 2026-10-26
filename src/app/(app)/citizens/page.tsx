"use client";

/**
 * FUQAROLAR — Mini App orqali murojaat yuborganlar.
 *
 * ⚠️ FUQARO — XODIM EMAS: bu yerda ruxsat/qamrov yo'q. Panel faqat
 * ro'yxatni ko'radi va kerak bo'lsa BLOKLAYDI. Blok — `citizens.manage`
 * (operatorда yo'q); ko'rish — `citizens.view`.
 */

import { useState } from "react";
import Link from "next/link";
import { Send, ShieldBan, UserCircle } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useBlockCitizen,
  useCitizens,
  type CitizenFilters,
} from "@/features/citizens/api";
import { useDistricts } from "@/features/territory/api";
import { ApiError } from "@/shared/api/client";
import { formatDateUz } from "@/shared/lib/date";
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
import { BlockDialog } from "@/features/citizens/block-dialog";
import { BroadcastDialog } from "@/features/citizens/broadcast-dialog";

const ALL = "__all__";
const BLOCKED = "blocked";
const ACTIVE = "active";

export default function CitizensPage() {
  const { can } = useSession();
  const [filters, setFilters] = useState<CitizenFilters>({ page: 1, limit: 50 });
  const [blockTarget, setBlockTarget] = useState<{
    id: string;
    name: string;
    blocked: boolean;
  } | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);

  const citizens = useCitizens(filters);
  const districts = useDistricts();
  const block = useBlockCitizen();

  const patch = (next: Partial<CitizenFilters>) =>
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));

  // ⚠️ BUTUN-SAHIFA GATE: ruxsatsiz odam bu bo'limni umuman ko'rmaydi
  // (server ham to'xtatadi — bu faqat qulaylik).
  if (!can("citizens.view")) {
    return (
      <EmptyState
        icon={UserCircle}
        title="Sizda bu bo'limga ruxsat yo'q"
        hint="Ma'muriyatga murojaat qiling."
      />
    );
  }

  const canManage = can("citizens.manage");
  const blockedFilter =
    filters.blocked === true ? BLOCKED : filters.blocked === false ? ACTIVE : ALL;

  return (
    <>
      <PageHeader
        title="Fuqarolar"
        actions={
          canManage ? (
            <Button variant="outline" onClick={() => setBroadcasting(true)}>
              <Send className="mr-1.5 size-4" />
              Xabar yuborish
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Input
          placeholder="Ism, username, telefon..."
          value={filters.search ?? ""}
          onChange={(event) => patch({ search: event.target.value || undefined })}
        />

        <Select
          value={filters.districtId ?? ALL}
          onValueChange={(value) => patch({ districtId: value === ALL ? undefined : value })}
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
          value={blockedFilter}
          onValueChange={(value) =>
            patch({ blocked: value === ALL ? undefined : value === BLOCKED })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barchasi</SelectItem>
            <SelectItem value={ACTIVE}>Faol</SelectItem>
            <SelectItem value={BLOCKED}>Bloklangan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        {citizens.isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : citizens.isError ? (
          <ErrorState
            message={citizens.error instanceof ApiError ? citizens.error.message : undefined}
            onRetry={() => void citizens.refetch()}
          />
        ) : (citizens.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={UserCircle}
            title="Fuqaro topilmadi"
            hint="Ilovadan murojaat yuborilgach, fuqarolar shu yerda ko'rinadi."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fuqaro</TableHead>
                <TableHead>Tuman</TableHead>
                <TableHead>Murojaat</TableHead>
                <TableHead>Ball</TableHead>
                <TableHead>Holat</TableHead>
                {canManage ? <TableHead className="text-right">Amal</TableHead> : null}
              </TableRow>
            </TableHeader>

            <TableBody>
              {citizens.data?.items.map((citizen) => (
                <TableRow key={citizen.id}>
                  <TableCell>
                    <Link
                      href={`/citizens/${citizen.id}`}
                      className="group block space-y-0.5"
                    >
                      <p className="font-medium group-hover:text-primary">{citizen.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {citizen.username ? `@${citizen.username}` : citizen.phone ?? "—"} ·{" "}
                        {formatDateUz(citizen.createdAt)}
                      </p>
                    </Link>
                  </TableCell>

                  <TableCell className="text-sm">
                    {citizen.districtName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  <TableCell className="text-sm tabular-nums">{citizen.appeals}</TableCell>

                  <TableCell className="text-sm tabular-nums">{citizen.points}</TableCell>

                  <TableCell>
                    {citizen.isBlocked ? (
                      <Badge className="bg-destructive/10 text-destructive">Bloklangan</Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Faol
                      </Badge>
                    )}
                  </TableCell>

                  {canManage ? (
                    <TableCell className="text-right">
                      <Button
                        variant={citizen.isBlocked ? "outline" : "ghost"}
                        size="sm"
                        className={citizen.isBlocked ? undefined : "text-destructive"}
                        onClick={() =>
                          setBlockTarget({
                            id: citizen.id,
                            name: citizen.name,
                            blocked: citizen.isBlocked,
                          })
                        }
                      >
                        <ShieldBan className="mr-1 size-3.5" />
                        {citizen.isBlocked ? "Blokni yechish" : "Bloklash"}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {citizens.data && citizens.data.total > citizens.data.limit ? (
        <div className="flex items-center justify-between pt-3">
          <p className="text-xs text-muted-foreground">
            {citizens.data.total} ta fuqaro · {citizens.data.page}-sahifa
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={citizens.data.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            >
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!citizens.data.hasMore}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
            >
              Keyingi
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── XABAR YUBORISH ───────────────────────────────────── */}
      {broadcasting ? <BroadcastDialog onClose={() => setBroadcasting(false)} /> : null}

      {/* ── BLOK DIALOGI ─────────────────────────────────────── */}
      {blockTarget ? (
        <BlockDialog
          name={blockTarget.name}
          currentlyBlocked={blockTarget.blocked}
          pending={block.isPending}
          onClose={() => setBlockTarget(null)}
          onConfirm={(reason) =>
            block.mutate(
              { id: blockTarget.id, blocked: !blockTarget.blocked, reason },
              { onSuccess: () => setBlockTarget(null) },
            )
          }
        />
      ) : null}
    </>
  );
}
