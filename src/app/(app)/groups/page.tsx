"use client";

/**
 * TELEGRAM GURUHLARI.
 *
 * ⚠️ SAHIFANING ENG MUHIM AMALI — "rasmiy" belgisi va u KUZATUVGA
 * ROZILIK ma'nosini bildiradi: qo'yilgandan keyin tizim guruhdagi
 * xabarlarni o'qiy boshlaydi. Shuning uchun ustun nomi "Kuzatuv"
 * deb yoziladi, "Rasmiy" emas — belgi NIMA QILISHINI aytishi
 * kerak.
 *
 * ⚠️ MFY BIRIKTIRISH — RASMIY BELGIDAN OLDIN. Server
 * biriktirilmagan guruhni kuzatuvga qo'yishni rad etadi: signallar
 * hududsiz qolib, faqat viloyat xodimiga ko'rinardi, ya'ni amalda
 * hech kim ko'rmasdi.
 */

import { useState } from "react";
import { MapPinOff, Radio, Users } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAssignMahalla,
  useGroupStats,
  useGroups,
  useSetOfficial,
  type GroupFilters,
} from "@/features/groups/api";
import { useMahallas } from "@/features/territory/api";
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
import { Switch } from "@/shared/ui/switch";
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
/** "Biriktirishni yechish" varianti. */
const NONE = "__none__";

export default function GroupsPage() {
  const { can } = useSession();

  const [filters, setFilters] = useState<GroupFilters>({ page: 1, limit: 50 });

  const groups = useGroups(filters);
  const stats = useGroupStats();
  const mahallas = useMahallas();

  const setOfficial = useSetOfficial();
  const assignMahalla = useAssignMahalla();

  const patch = (next: Partial<GroupFilters>) =>
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));

  return (
    <>
      <PageHeader
        title="Telegram guruhlari"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Jami guruh" value={stats.data?.total ?? "—"} icon={Users} />
        <StatTile
          label="Kuzatuvda"
          value={stats.data?.official ?? "—"}
          icon={Radio}
          tone="success"
        />
        <StatTile
          label="MFY biriktirilmagan"
          value={stats.data?.unassigned ?? "—"}
          icon={MapPinOff}
          tone={stats.data?.unassigned ? "warning" : "default"}
        />
        <StatTile
          label="Navbatdagi xabar"
          value={stats.data?.pendingMessages ?? "—"}
          hint="Keyingi tahlilda ko'riladi"
        />
      </div>

      {/* ── Filtrlar ─────────────────────────────────────────── */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Guruh nomi yoki chat ID..."
          value={filters.search ?? ""}
          onChange={(event) => patch({ search: event.target.value || undefined })}
        />

        <Select
          value={
            filters.isOfficial === undefined ? ALL : filters.isOfficial ? "yes" : "no"
          }
          onValueChange={(value) =>
            patch({ isOfficial: value === ALL ? undefined : value === "yes" })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Kuzatuv" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha guruhlar</SelectItem>
            <SelectItem value="yes">Kuzatuvda</SelectItem>
            <SelectItem value="no">Kuzatuvda emas</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.mahallaId ?? ALL}
          onValueChange={(value) =>
            patch({ mahallaId: value === ALL ? undefined : value, unassigned: undefined })
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

        <Button
          variant={filters.unassigned ? "default" : "outline"}
          onClick={() =>
            patch({
              unassigned: filters.unassigned ? undefined : true,
              mahallaId: undefined,
            })
          }
        >
          <MapPinOff className="size-4" />
          Biriktirilmaganlar
        </Button>
      </div>

      {/* ── Jadval ───────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        {groups.isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : groups.isError ? (
          <ErrorState
            message={groups.error instanceof ApiError ? groups.error.message : undefined}
            onRetry={() => void groups.refetch()}
          />
        ) : (groups.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={Users}
            title="Guruh topilmadi"
            hint={
              filters.search || filters.isOfficial !== undefined || filters.unassigned
                ? "Filtrlarni kengaytirib ko'ring."
                : "Botni MFY guruhiga qo'shing. Bot faqat o'ziga kelgan hodisadan guruhni biladi, shuning uchun qo'shilgandan keyin guruhda biror harakat bo'lishi kerak."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guruh</TableHead>
                <TableHead>MFY</TableHead>
                <TableHead>Kuzatuv</TableHead>
                <TableHead className="text-right">Navbat</TableHead>
                <TableHead className="text-right">Signal</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groups.data?.items.map((group) => (
                <TableRow key={group.chatId}>
                  {/* ── Guruh ───────────────────────────────── */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium">{group.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <code>{group.chatId}</code>
                        {group.username ? <span>@{group.username}</span> : null}
                        <span>{formatDateUz(group.joinedAt)}</span>
                      </div>

                      {/*
                        ⚠️ BOT CHIQARIB YUBORILGANI AYTILADI:
                        kuzatuv yoqilgan, lekin bot guruhda yo'q
                        bo'lsa, xabarlar KELMAYDI — va buni hech
                        narsa ko'rsatmasa, operator "nega signal
                        yo'q" deb hayron bo'lardi.
                      */}
                      {!group.isPresent ? (
                        <Badge className="bg-destructive/10 text-destructive">
                          Bot guruhda yo&apos;q
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>

                  {/* ── MFY biriktirish ─────────────────────── */}
                  <TableCell>
                    {can("groups.assign") ? (
                      <Select
                        value={group.mahalla?.id ?? NONE}
                        onValueChange={(value) =>
                          assignMahalla.mutate({
                            chatId: group.chatId,
                            mahallaId: value === NONE ? null : value,
                          })
                        }
                        disabled={assignMahalla.isPending}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="Tanlanmagan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>— Biriktirilmagan —</SelectItem>
                          {mahallas.data?.map((mahalla) => (
                            <SelectItem key={mahalla.id} value={mahalla.id}>
                              {mahalla.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : group.mahalla ? (
                      <div className="text-sm">
                        <p>{group.mahalla.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.mahalla.district.name}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-amber-600 dark:text-amber-400">
                        Biriktirilmagan
                      </span>
                    )}
                  </TableCell>

                  {/* ── Kuzatuv ─────────────────────────────── */}
                  <TableCell>
                    {can("groups.official") ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={group.isOfficial}
                          onCheckedChange={(checked) =>
                            setOfficial.mutate({
                              chatId: group.chatId,
                              isOfficial: checked,
                            })
                          }
                          // ⚠️ MFY YO'Q BO'LSA O'CHIRILGAN: server
                          // baribir rad etardi, lekin tugmani
                          // o'chirish SABABNI oldindan ko'rsatadi
                          // (yonidagi izoh bilan).
                          disabled={
                            setOfficial.isPending ||
                            (!group.isOfficial && !group.mahalla)
                          }
                          aria-label="Kuzatuv"
                        />
                        {!group.isOfficial && !group.mahalla ? (
                          <span className="text-xs text-muted-foreground">
                            Avval MFY
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <Badge
                        className={
                          group.isOfficial
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }
                      >
                        {group.isOfficial ? "Yoqilgan" : "O'chirilgan"}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="tabular text-right text-sm">
                    {group.pendingMessages || "—"}
                  </TableCell>

                  <TableCell className="tabular text-right text-sm">
                    {group.newSignals ? (
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {group.newSignals}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {groups.data && groups.data.total > groups.data.limit ? (
        <div className="flex items-center justify-between pt-3">
          <p className="text-xs text-muted-foreground">
            {groups.data.total} ta guruh · {groups.data.page}-sahifa
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={groups.data.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            >
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!groups.data.hasMore}
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
