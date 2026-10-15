"use client";

/**
 * HUDUD — tuman va MFY reyestri.
 *
 * ⚠️ MFY — TIZIMNING ASOSIY KUZATUV OBYEKTI va hamma hisobot shu
 * kesimda quriladi. Shuning uchun sahifa izohi "nima uchun bu
 * kerak" ni aytadi: biriktirilmagan guruh kuzatuvga ham
 * qo'yilmaydi.
 *
 * ⚠️ O'CHIRISH YO'Q, ARXIVLASH BOR: tumanga biriktirilgan MFY,
 * guruhlar, signallar va murojaatlar tarixi qoladi.
 */

import { useState } from "react";
import { Archive, ArchiveRestore, MapPin, Pencil, Plus } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useArchiveTerritory,
  useDistricts,
  useMahallas,
  useSaveDistrict,
  useSaveMahalla,
} from "@/features/territory/api";
import { ApiError } from "@/shared/api/client";
import type { District, Mahalla } from "@/shared/api/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FieldError, Input, Label } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { EmptyState, ErrorState, Spinner, TableSkeleton } from "@/shared/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { PageHeader } from "@/widgets/page-header/page-header";

export default function TerritoryPage() {
  const { can, isProvinceWide } = useSession();

  const [districtForm, setDistrictForm] = useState<Partial<District> | null>(null);
  const [mahallaForm, setMahallaForm] = useState<Partial<Mahalla> | null>(null);

  const districts = useDistricts(true);
  const mahallas = useMahallas({ includeArchived: true });
  const archive = useArchiveTerritory();

  const canManage = can("territory.manage");

  return (
    <>
      <PageHeader
        title="Hudud"
      />

      <Tabs defaultValue="mahallas">
        <TabsList>
          <TabsTrigger value="mahallas">MFY</TabsTrigger>
          <TabsTrigger value="districts">Tumanlar</TabsTrigger>
        </TabsList>

        {/* ══ MFY ══════════════════════════════════════════════ */}
        <TabsContent value="mahallas">
          {canManage ? (
            <div className="mb-3 flex justify-end">
              <Button onClick={() => setMahallaForm({})}>
                <Plus className="size-4" />
                MFY qo&apos;shish
              </Button>
            </div>
          ) : null}

          <div className="rounded-lg border bg-card">
            {mahallas.isLoading ? (
              <TableSkeleton rows={6} cols={5} />
            ) : mahallas.isError ? (
              <ErrorState
                message={
                  mahallas.error instanceof ApiError ? mahallas.error.message : undefined
                }
                onRetry={() => void mahallas.refetch()}
              />
            ) : (mahallas.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={MapPin}
                title="MFY kiritilmagan"
                hint="Avval tuman qo'shing, so'ng unga MFY larni kiriting. Telegram guruhlari shundan keyin biriktiriladi."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MFY</TableHead>
                    <TableHead>Tuman</TableHead>
                    <TableHead>Rais</TableHead>
                    <TableHead className="text-right">Guruh</TableHead>
                    <TableHead className="text-right">Murojaat</TableHead>
                    {canManage ? <TableHead /> : null}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {mahallas.data?.map((mahalla) => (
                    <TableRow key={mahalla.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{mahalla.name}</p>
                            {mahalla.isArchived ? (
                              <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Arxiv
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <code>{mahalla.code}</code>
                            {mahalla.population
                              ? ` · ${mahalla.population.toLocaleString("en-US").replace(/,/g, " ")} aholi`
                              : null}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">{mahalla.district.name}</TableCell>

                      <TableCell className="text-sm">
                        {mahalla.chairmanName ? (
                          <div>
                            <p>{mahalla.chairmanName}</p>
                            {mahalla.chairmanPhone ? (
                              <p className="text-xs text-muted-foreground">
                                {mahalla.chairmanPhone}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="tabular text-right text-sm">
                        {mahalla.groupCount || "—"}
                      </TableCell>

                      <TableCell className="tabular text-right text-sm">
                        {mahalla.issueCount || "—"}
                      </TableCell>

                      {canManage ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMahallaForm(mahalla)}
                              aria-label="Tahrirlash"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                archive.mutate({
                                  kind: "mahalla",
                                  id: mahalla.id,
                                  archived: !mahalla.isArchived,
                                })
                              }
                              disabled={archive.isPending}
                              aria-label={
                                mahalla.isArchived ? "Arxivdan qaytarish" : "Arxivlash"
                              }
                            >
                              {mahalla.isArchived ? (
                                <ArchiveRestore className="size-3.5" />
                              ) : (
                                <Archive className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ══ TUMANLAR ═════════════════════════════════════════ */}
        <TabsContent value="districts">
          {/*
            ⚠️ TUMAN YARATISH — FAQAT VILOYAT DARAJASI: tuman
            xodimi yangi tuman ochib, o'zini unga biriktirsa,
            qamrovidan chiqib ketardi. Server ham bunga ruxsat
            bermaydi.
          */}
          {canManage && isProvinceWide ? (
            <div className="mb-3 flex justify-end">
              <Button onClick={() => setDistrictForm({})}>
                <Plus className="size-4" />
                Tuman qo&apos;shish
              </Button>
            </div>
          ) : null}

          <div className="rounded-lg border bg-card">
            {districts.isLoading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : (districts.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={MapPin}
                title="Tuman kiritilmagan"
                hint="Tizimni ishlatishni tumanlar ro'yxatidan boshlang."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tuman</TableHead>
                    <TableHead className="text-right">MFY soni</TableHead>
                    {canManage && isProvinceWide ? <TableHead /> : null}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {districts.data?.map((district) => (
                    <TableRow key={district.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{district.name}</p>
                          <code className="text-xs text-muted-foreground">
                            {district.code}
                          </code>
                          {district.isArchived ? (
                            <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Arxiv
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="tabular text-right text-sm">
                        {district.mahallaCount || "—"}
                      </TableCell>

                      {canManage && isProvinceWide ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDistrictForm(district)}
                              aria-label="Tahrirlash"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                archive.mutate({
                                  kind: "district",
                                  id: district.id,
                                  archived: !district.isArchived,
                                })
                              }
                              disabled={archive.isPending}
                              aria-label={
                                district.isArchived ? "Arxivdan qaytarish" : "Arxivlash"
                              }
                            >
                              {district.isArchived ? (
                                <ArchiveRestore className="size-3.5" />
                              ) : (
                                <Archive className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {districtForm ? (
        <DistrictDialog
          initial={districtForm}
          onClose={() => setDistrictForm(null)}
        />
      ) : null}

      {mahallaForm ? (
        <MahallaDialog initial={mahallaForm} onClose={() => setMahallaForm(null)} />
      ) : null}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  TUMAN OYNASI
// ═══════════════════════════════════════════════════════════════════

const DistrictDialog = ({
  initial,
  onClose,
}: {
  initial: Partial<District>;
  onClose: () => void;
}) => {
  const save = useSaveDistrict();

  const [code, setCode] = useState(initial.code ?? "");
  const [name, setName] = useState(initial.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial.sortOrder ?? 0));

  const isValid = code.trim().length >= 2 && name.trim().length >= 2;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial.id ? "Tumanni tahrirlash" : "Tuman qo'shish"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="d-name">Nomi *</Label>
            <Input
              id="d-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Chilonzor tumani"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="d-code">Kod *</Label>
            <Input
              id="d-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="chilonzor"
            />
            {/* ⚠️ SERVER KODNI NORMALLASHTIRADI (kichik harf,
                defis) va foydalanuvchi buni bilishi kerak — aks
                holda u "Chilonzor" yozib, keyin "chilonzor"
                ko'rib hayron bo'lardi. */}
            <p className="text-xs text-muted-foreground">
              Kichik harfga o&apos;tkaziladi, bo&apos;shliqlar defisga almashadi.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="d-order">Tartib</Label>
            <Input
              id="d-order"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Bekor qilish
          </Button>
          <Button
            disabled={!isValid || save.isPending}
            onClick={() =>
              save.mutate(
                {
                  id: initial.id,
                  code: code.trim(),
                  name: name.trim(),
                  sortOrder: Number.parseInt(sortOrder, 10) || 0,
                },
                { onSuccess: onClose },
              )
            }
          >
            {save.isPending ? <Spinner /> : null}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MFY OYNASI
// ═══════════════════════════════════════════════════════════════════

const MahallaDialog = ({
  initial,
  onClose,
}: {
  initial: Partial<Mahalla>;
  onClose: () => void;
}) => {
  const save = useSaveMahalla();
  // ⚠️ FAQAT ARXIVLANMAGAN TUMANLAR: server arxivlangan tumanga
  // MFY qo'shishni rad etadi (yangi MFY ko'rinmas joyga tushardi).
  const districts = useDistricts(false);

  const [districtId, setDistrictId] = useState(initial.district?.id ?? "");
  const [code, setCode] = useState(initial.code ?? "");
  const [name, setName] = useState(initial.name ?? "");
  const [chairmanName, setChairmanName] = useState(initial.chairmanName ?? "");
  const [chairmanPhone, setChairmanPhone] = useState(initial.chairmanPhone ?? "");
  const [population, setPopulation] = useState(
    initial.population != null ? String(initial.population) : "",
  );

  const isValid =
    districtId.length > 0 && code.trim().length >= 2 && name.trim().length >= 2;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial.id ? "MFY ni tahrirlash" : "MFY qo'shish"}</DialogTitle>
          <DialogDescription>
            Rais ma&apos;lumoti murojaat kartasida ko&apos;rinadi — kim bilan
            gaplashish kerakligini topish uchun.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tuman *</Label>
            {districts.isLoading ? (
              <div className="flex h-9 items-center px-3">
                <Spinner className="text-muted-foreground" />
              </div>
            ) : (districts.data?.length ?? 0) === 0 ? (
              <FieldError message="Avval tuman qo'shing." />
            ) : (
              <Select value={districtId} onValueChange={setDistrictId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {districts.data?.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="m-name">Nomi *</Label>
              <Input
                id="m-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Navbahor MFY"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-code">Kod *</Label>
              <Input
                id="m-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="navbahor"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="m-chair">Rais</Label>
              <Input
                id="m-chair"
                value={chairmanName}
                onChange={(event) => setChairmanName(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-phone">Telefon</Label>
              <Input
                id="m-phone"
                value={chairmanPhone}
                onChange={(event) => setChairmanPhone(event.target.value)}
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-pop">Aholi soni</Label>
            <Input
              id="m-pop"
              type="number"
              min={0}
              value={population}
              onChange={(event) => setPopulation(event.target.value)}
            />
            {/* ⚠️ NIMA UCHUN KERAKLIGI AYTILADI: aks holda maydon
                bo'sh qolardi va hisobotdagi "1000 aholiga" kesimi
                hech qachon ishlamasdi. */}
            <p className="text-xs text-muted-foreground">
              Hisobotda &quot;1000 aholiga nechta murojaat&quot; kesimi uchun.
              Ixtiyoriy.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Bekor qilish
          </Button>
          <Button
            disabled={!isValid || save.isPending}
            onClick={() =>
              save.mutate(
                {
                  id: initial.id,
                  districtId,
                  code: code.trim(),
                  name: name.trim(),
                  chairmanName: chairmanName.trim() || undefined,
                  chairmanPhone: chairmanPhone.trim() || undefined,
                  // ⚠️ BO'SH MAYDON `undefined`, `0` EMAS: `0` aholi
                  // "ma'lum va nol" degan ma'noni berib, "1000
                  // aholiga" hisobini buzardi.
                  population: population.trim()
                    ? Number.parseInt(population, 10)
                    : undefined,
                },
                { onSuccess: onClose },
              )
            }
          >
            {save.isPending ? <Spinner /> : null}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
