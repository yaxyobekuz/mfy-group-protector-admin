"use client";

/**
 * FUQAROLAR — mobil ilova foydalanuvchilari.
 *
 * ⚠️ YARATISH VA O'CHIRISH YO'Q. Hisob Telegram orqali o'zi
 * ochiladi, o'chirish esa murojaatlarni muallifsiz qoldirardi
 * (`Issue.citizen` — `Restrict`). Panelda bor yagona amal —
 * CHEKLASH va uni qaytarish.
 *
 * ⚠️ "XODIMLAR" SAHIFASIDAN ALOHIDA va shunday qolishi kerak:
 * fuqaroda ruxsat ham, hududiy qamrov ham, panelga kirish ham
 * yo'q. Ikkisini bitta ro'yxatga qo'shish "bu odamga ruxsat
 * berilganmi" degan savolni har qatorda tug'dirardi.
 */

import { Ban, Search, ShieldCheck, UserX, UsersRound } from "lucide-react";
import { useState } from "react";

import {
  useBlockCitizen,
  useCitizen,
  useCitizenStats,
  useCitizens,
  useUnblockCitizen,
} from "@/features/citizens/api";
import { useDistricts } from "@/features/territory/api";
import { useSession } from "@/entities/session/auth-provider";
import { fileUrl } from "@/shared/api/client";
import { ISSUE_STATUS } from "@/shared/config/labels";
import { formatDateTimeUz, formatDateUz, formatRelativeUz } from "@/shared/lib/date";
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

/** `Select` bo'sh satrni qabul qilmaydi — "hammasi" uchun kalit. */
const ALL = "__all__";

export default function CitizensPage() {
  const { can, isProvinceWide } = useSession();

  const [search, setSearch] = useState("");
  const [districtId, setDistrictId] = useState<string>(ALL);
  const [blocked, setBlocked] = useState<string>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const districts = useDistricts();
  const stats = useCitizenStats();

  const { data, isLoading, isError, error, refetch } = useCitizens({
    search: search.trim() || undefined,
    districtId: districtId === ALL ? undefined : districtId,
    blocked: blocked === ALL ? undefined : blocked === "yes",
    limit: 100,
  });

  const detail = useCitizen(openId);
  const block = useBlockCitizen();
  const unblock = useUnblockCitizen();

  const canManage = can("citizens.manage");

  return (
    <div>
      <PageHeader title="Fuqarolar" />

      {/* ── KO'RSATKICHLAR ──────────────────────────────────── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Jami ro'yxatdan o'tgan"
          value={stats.data?.total ?? 0}
          icon={UsersRound}
          featured
        />
        <StatTile
          label="Oxirgi 30 kunda faol"
          value={stats.data?.active30 ?? 0}
          hint="Ilovani ochganlar"
        />
        <StatTile
          label="Cheklangan"
          value={stats.data?.blocked ?? 0}
          tone={stats.data?.blocked ? "danger" : "default"}
        />
        {/* ⚠️ FAQAT VILOYAT DARAJASIDA: tuman xodimida bu raqam
            har doim 0 bo'lardi va chalg'itardi. */}
        {isProvinceWide ? (
          <StatTile
            label="Hududi tanlanmagan"
            value={stats.data?.noDistrict ?? 0}
            hint="Faqat viloyat darajasida ko'rinadi"
          />
        ) : null}
      </div>

      {/* ── FILTR ───────────────────────────────────────────── */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[16rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ism, username, telefon yoki Telegram ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          {isProvinceWide ? (
            <Select value={districtId} onValueChange={setDistrictId}>
              <SelectTrigger className="w-[13rem]">
                <SelectValue placeholder="Tuman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha tumanlar</SelectItem>
                {(districts.data ?? []).map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select value={blocked} onValueChange={setBlocked}>
            <SelectTrigger className="w-[11rem]">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              <SelectItem value="no">Faol</SelectItem>
              <SelectItem value="yes">Cheklangan</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ── RO'YXAT ─────────────────────────────────────────── */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : isError ? (
          <ErrorState message={error?.message} onRetry={() => void refetch()} />
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Fuqaro topilmadi"
            hint="Hisob ilova birinchi marta ochilganda o'zi yaratiladi."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fuqaro</TableHead>
                <TableHead>Hudud</TableHead>
                <TableHead className="text-right">Murojaat</TableHead>
                <TableHead className="text-right">Ball</TableHead>
                <TableHead>Oxirgi faollik</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {data!.items.map((citizen) => {
                const photo = fileUrl(citizen.photoUrl);
                const name = [citizen.firstName, citizen.lastName]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <TableRow
                    key={citizen.id}
                    className="cursor-pointer"
                    onClick={() => setOpenId(citizen.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt=""
                            className="size-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                            {citizen.firstName.charAt(0)}
                          </span>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-medium">{name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {citizen.username
                              ? `@${citizen.username}`
                              : citizen.phone ?? citizen.telegramId}
                          </p>
                        </div>

                        {citizen.isBlocked ? (
                          <Badge className="bg-destructive/10 text-destructive">
                            Cheklangan
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {citizen.district?.name ?? "—"}
                      {citizen.mahalla ? (
                        <span className="block text-xs">{citizen.mahalla.name}</span>
                      ) : null}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {citizen.appealCount}
                    </TableCell>

                    <TableCell className="text-right font-medium tabular-nums">
                      {citizen.points}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeUz(citizen.lastSeenAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      {canManage ? (
                        <Button
                          size="sm"
                          variant={citizen.isBlocked ? "outline" : "ghost"}
                          onClick={(event) => {
                            // ⚠️ QATOR BOSILISHI TO'XTATILADI: usiz
                            // cheklash tugmasi bir vaqtda kartani
                            // ham ochardi.
                            event.stopPropagation();

                            if (citizen.isBlocked) {
                              unblock.mutate(citizen.id);
                            } else {
                              setReason("");
                              setBlockingId(citizen.id);
                            }
                          }}
                        >
                          {citizen.isBlocked ? (
                            <>
                              <ShieldCheck className="size-4" />
                              Cheklovni olish
                            </>
                          ) : (
                            <>
                              <Ban className="size-4" />
                              Cheklash
                            </>
                          )}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ── CHEKLASH ────────────────────────────────────────── */}
      <Dialog
        open={blockingId !== null}
        onOpenChange={(open) => !open && setBlockingId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hisobni cheklash</DialogTitle>
            <DialogDescription>
              {/* ⚠️ OQIBATI AYTILADI: operator "bu nima qiladi"
                  degan savolga javobni TUGMANI BOSGUNCHA olishi
                  kerak. */}
              Cheklangan fuqaro ilovadan murojaat yubora olmaydi. Yozgan
              murojaatlari joyida qoladi. Sabab unga ilovada ko&apos;rsatiladi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reason">Sabab</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Masalan: bir kunda o'nlab asossiz murojaat yuborildi"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockingId(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < 3 || block.isPending}
              onClick={() => {
                block.mutate(
                  { id: blockingId!, reason: reason.trim() },
                  { onSuccess: () => setBlockingId(null) },
                );
              }}
            >
              <UserX className="size-4" />
              Cheklash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── KARTA ───────────────────────────────────────────── */}
      <Dialog open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detail.data
                ? [detail.data.firstName, detail.data.lastName]
                    .filter(Boolean)
                    .join(" ")
                : "Fuqaro"}
            </DialogTitle>
          </DialogHeader>

          {detail.isLoading ? (
            <TableSkeleton rows={4} cols={2} />
          ) : detail.isError || !detail.data ? (
            <ErrorState message={detail.error?.message} />
          ) : (
            <div className="space-y-4">
              {detail.data.isBlocked ? (
                <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">Hisob cheklangan</p>
                  <p className="mt-0.5">{detail.data.blockedReason}</p>
                  <p className="mt-1 text-xs opacity-80">
                    {formatDateTimeUz(detail.data.blockedAt)}
                  </p>
                </div>
              ) : null}

              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {[
                  { label: "Telegram", value: detail.data.username ? `@${detail.data.username}` : detail.data.telegramId },
                  { label: "Telefon", value: detail.data.phone ?? "—" },
                  { label: "Tuman", value: detail.data.district?.name ?? "—" },
                  { label: "MFY", value: detail.data.mahalla?.name ?? "—" },
                  { label: "Ro'yxatdan o'tgan", value: formatDateUz(detail.data.createdAt) },
                  { label: "Ball", value: String(detail.data.points) },
                ].map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs text-muted-foreground">{row.label}</dt>
                    <dd className="mt-0.5 font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Jami", value: detail.data.stats.total },
                  { label: "Ochiq", value: detail.data.stats.open },
                  { label: "Hal qilindi", value: detail.data.stats.resolved },
                ].map((row) => (
                  <div key={row.label} className="rounded-xl bg-muted/60 p-3 text-center">
                    <p className="text-xl font-semibold tabular-nums">{row.value}</p>
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                  </div>
                ))}
              </div>

              {detail.data.recentAppeals.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium">Oxirgi murojaatlar</p>
                  <div className="max-h-64 space-y-1.5 overflow-y-auto">
                    {detail.data.recentAppeals.map((appeal) => (
                      <a
                        key={appeal.id}
                        href={`/issues/${appeal.id}`}
                        className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5 text-sm transition hover:bg-accent"
                      >
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {appeal.publicNo}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{appeal.title}</span>
                        <Badge className={ISSUE_STATUS[appeal.status].className}>
                          {ISSUE_STATUS[appeal.status].label}
                        </Badge>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
