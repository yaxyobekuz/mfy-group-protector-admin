"use client";

/**
 * TUMANLAR XARITASI — boshqaruv panelidagi blok.
 *
 * ── NEGA WIDGET, ALOHIDA SAHIFA EMAS ───────────────────────────────
 *
 * ⚠️ BU BLOK BOSHQARUV PANELIDA TURADI. Avval u alohida sahifa edi
 * (`/district-map`) va o'sha joyda "qaysi tumanda nima bo'lyapti"
 * degan savol panelning o'zidan AJRALIB qolardi: operator avval
 * panelni ko'rib, keyin yana bir sahifaga o'tishi kerak edi.
 *
 * ⚠️ O'Z HOLATI O'ZIDA (filtr, ko'rsatkich, tanlangan tuman):
 * boshqaruv panelining qolgan kartalari BUTUN TARIX bo'yicha
 * ishlaydi va xaritaning sana filtri ularga TEGMAYDI. Holat
 * yuqoriga ko'tarilsa, xaritada "7 kun" tanlangani butun panelni
 * o'zgartirib yuborardi — operator esa buni kutmaydi.
 *
 * ── NEGA `/map` DAN BOSHQA ─────────────────────────────────────────
 *
 * ⚠️ `/map` — NUQTALAR xaritasi (koordinatali murojaatlar, Leaflet).
 * U faqat fuqaro ilovada JOY BELGILAGAN murojaatlarni ko'rsatadi,
 * ya'ni botdan va signaldan kelganlar u yerda UMUMAN yo'q. Bu blok
 * esa HUDUD kesimi: har tuman bitta shakl va undagi BARCHA yozuvlar
 * sanaladi. Ikkisini birlashtirish "xaritada 12 ta nuqta, lekin
 * hisobotda 340 ta murojaat" degan tushunarsiz holatni berardi.
 *
 * ── DOKTRINA: UCH OQIM QO'SHILMAYDI ────────────────────────────────
 *
 * ⚠️ Murojaat, signal va xavfsizlik hodisasi — UCH ALOHIDA
 * ko'rsatkich va ular bitta "muammolilik ballariga" YIG'ILMAYDI.
 * Signal — AI taxmini, muammo — rasmiy fakt, xavfsizlik hodisasi —
 * qat'iy qoida natijasi. Yig'ilsa, rang nimani bildirishini hech kim
 * ayta olmasdi. Shuning uchun foydalanuvchi KO'RSATKICHNI TANLAYDI
 * va xarita faqat o'shani bo'yaydi.
 */

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Filter,
  Info,
  Layers,
  RotateCcw,
  Search,
  TrendingUp,
} from "lucide-react";

import { useDistrictMap, useMahallaMap, type ReportFilters } from "@/features/reports/api";
import { useBoundaries } from "@/features/territory/api";
import { useAllCategories } from "@/features/issues/api";
import { ApiError } from "@/shared/api/client";
import type { DistrictMapRow } from "@/shared/api/types";
import {
  DISTRICT_SHAPES,
  SHAPE_ALIASES,
  normalizeName,
} from "@/shared/config/district-shapes";
import { cn } from "@/shared/lib/cn";
import { daysAgoInput, toInputDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input, Label } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ErrorState } from "@/shared/ui/states";
import { METRICS, type MapMetric } from "@/widgets/district-map/district-choropleth";
import { MapView } from "@/widgets/issue-map/map-view";
import { buildTerritoryAreas } from "@/widgets/issue-map/territory-areas";
import { DistrictDetail } from "@/widgets/district-map/district-detail";

const ALL = "__all__";

/**
 * ⚠️ MARKAZ VA MASSHTAB `/map` BILAN AYNI: ikki xarita bir xil
 * hududni ko'rsatadi va boshqa qiymat berilsa, tabdan sahifaga
 * o'tgan xodim o'zini boshqa joyda deb o'ylardi.
 *
 * ⚠️ ZOOM 9, 11 EMAS: bu yerda xarita KARTA ichida va balandligi
 * `aspect-[1000/546]` bilan cheklangan — 11 da viloyatning yarmi
 * ko'rinmay qolardi.
 */
const CENTER: [number, number] = [40.7821, 72.3442];
const ZOOM = 9;

export const DistrictMapPanel = () => {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [metricKey, setMetricKey] = useState<MapMetric>("issues");
  const [search, setSearch] = useState("");
  /** Tanlangan tuman — bazada bor bo'lsa `row`, bo'lmasa faqat nomi. */
  const [selected, setSelected] = useState<{
    row: DistrictMapRow | null;
    name: string;
  } | null>(null);

  const report = useDistrictMap(filters);
  const categories = useAllCategories();

  /**
   * ── TUMAN → MFY DRILL-DOWN ────────────────────────────────
   *
   * ⚠️ GEOMETRIYA ENDI BAZADAN KELADI, KODDAGI SVG DAN EMAS:
   * `useBoundaries` tuman chegaralarini, `useMahallaMap` esa MFY
   * poligonlarini beradi. Ikkisi ham `/map` sahifasida ishlatiladi
   * va so'rovlar KESHLANGAN (`staleTime`), ya'ni tab almashtirish
   * ularni qayta yuklamaydi.
   *
   * ⚠️ MFY KESIMI FAQAT TUMAN OCHILGANDA SO'RALADI: javobda
   * poligonlar bor va u og'ir (~1 MB). Viloyat ko'rinishida u
   * umuman kerak emas.
   */
  const boundaries = useBoundaries();
  const [openDistrict, setOpenDistrict] = useState<string | null>(null);
  const mahallas = useMahallaMap(openDistrict ? filters : {});

  /**
   * ⚠️ `resolvedTheme`, `theme` EMAS: foydalanuvchi "tizim"
   * rejimini tanlasa, `theme` "system" bo'lib qoladi va xarita
   * har doim oq turardi (`map/page.tsx` dagi ayni sabab).
   */
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const metric = METRICS.find((item) => item.key === metricKey) ?? METRICS[0]!;
  const rows = useMemo(() => report.data?.districts ?? [], [report.data]);

  /** Reyting — xaritaning yonidagi ro'yxat (qidiruv bilan). */
  const ranked = useMemo(() => {
    const needle = normalizeName(search);
    return [...rows]
      .filter((row) => !needle || normalizeName(row.name).includes(needle))
      .sort((a, b) => b[metric.key] - a[metric.key]);
  }, [rows, metric.key, search]);


  /**
   * XARITADAGI POLIGONLAR.
   *
   * ⚠️ `buildTerritoryAreas` — YAGONA MANBA: `/map` sahifasi ham
   * shuni chaqiradi. Farq faqat SONDA: u yerda murojaat soni, bu
   * yerda TANLANGAN KO'RSATKICH.
   *
   * ⚠️ TUMAN RANGI KO'RSATKICH GRADIENTIDAN (`mix`): eng
   * kattasiga nisbatan, `DistrictChoropleth` dagi ayni hisob —
   * aks holda bir xil ma'lumot ikki sahifada ikki xil rangda
   * ko'rinardi.
   *
   * ⚠️ ICHKI MFY LAR RANGI BERILMAYDI (`color` yo'q): u yerda
   * xaritaning O'Z shkalasi ishlaydi (murojaat soniga qarab).
   * Sabab — `/reports/mahalla-map` faqat MUROJAAT sonini beradi:
   * signal va xavfsizlik hodisasi MFY kesimida UMUMAN yo'q.
   * Ko'rsatkich gradienti u yerda ishlatilsa, "signallar" rangi
   * aslida murojaat sonini ko'rsatib, YOLG'ON kesim bo'lardi.
   */
  const areas = useMemo(() => {
    const byId = new Map(rows.map((row) => [row.id, row]));
    return buildTerritoryAreas({
      districts: boundaries.data?.districts ?? [],
      mahallas: mahallas.data ?? [],
      openDistrict,
      districtCount: (district) => byId.get(district.id)?.[metric.key] ?? 0,
      mahallaCount: (item) => item.total,
      onOpen: (id) => {
        setOpenDistrict(id);
        // ⚠️ O'NG USTUN HAM OCHILADI: avvalgi xatti-harakat
        // saqlanadi — tuman bosilganda uning tafsiloti ko'rinardi.
        const row = byId.get(id);
        if (row) setSelected({ row, name: row.name });
      },
    });
  }, [rows, metric, boundaries.data, mahallas.data, openDistrict]);

  /** Ochilgan tumanning nomi — yo'lakchadagi yozuv uchun. */
  const openDistrictName = rows.find((row) => row.id === openDistrict)?.name ?? null;

  /** Viloyat bo'yicha jami — xarita ustidagi plitkalar. */
  const totals = useMemo(() => {
    const sum = (pick: (row: DistrictMapRow) => number) =>
      rows.reduce((acc, row) => acc + pick(row), 0);
    return {
      issues: sum((r) => r.issues),
      open: sum((r) => r.open),
      overdue: sum((r) => r.overdue),
      signals: sum((r) => r.signals),
      signalsNew: sum((r) => r.signalsNew),
      security: sum((r) => r.security),
    };
  }, [rows]);

  /**
   * ⚠️ BAZADA YO'Q TUMANLAR — ALOHIDA OGOHLANTIRISH: xaritada 15 ta
   * shakl bor, bazada esa ulardan bir qismi bo'lishi mumkin.
   * Aytilmasa, operator shtrixlangan joyni "muammo yo'q" deb o'qib,
   * butun tumanni e'tibordan chetda qoldirardi.
   */
  const missing = useMemo(() => {
    if (!report.data) return [];
    return DISTRICT_SHAPES.filter((shape) => {
      const aliases = new Set([
        ...(SHAPE_ALIASES[shape.slug] ?? []),
        normalizeName(shape.name),
      ]);
      return !rows.some(
        (row) => aliases.has(normalizeName(row.name)) || aliases.has(normalizeName(row.code)),
      );
    });
  }, [rows, report.data]);

  const patch = (next: Partial<ReportFilters>) =>
    setFilters((prev) => ({ ...prev, ...next }));

  const hasFilters = Boolean(
    filters.from || filters.to || filters.categoryId || filters.districtId,
  );

  return (
    <section className="space-y-4">
      {/*
        ⚠️ SARLAVHA `PageHeader` EMAS: u sahifa sarlavhasi (`h1`) va
        boshqaruv panelida allaqachon bittasi bor ("Xush kelibsiz").
        Ikkinchi `h1` sahifa tuzilmasini buzardi — bu yerda `h2`.
      */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {/*
          ⚠️ IZOH QATORI OLIB TASHLANDI: "Hudud kesimida murojaat,
          signal va xavfsizlik" degan matn ostidagi ko'rsatkich
          tanlovida AYNI nomlar bilan takrorlanardi — ya'ni u
          hech narsa qo'shmasdi.
        */}
        <h2 className="text-lg font-semibold tracking-tight">Tumanlar xaritasi</h2>

        <Button variant="outline" size="sm" asChild>
          <Link href="/map">
            Nuqtalar xaritasi
            <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </Button>
      </div>

      {/* ══ FILTRLAR ═══════════════════════════════════════════ */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <Filter className="size-3" />
              Boshlanish
            </Label>
            <Input
              type="date"
              value={filters.from ?? ""}
              max={filters.to || toInputDate(new Date())}
              onChange={(event) => patch({ from: event.target.value || undefined })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tugash</Label>
            <Input
              type="date"
              value={filters.to ?? ""}
              min={filters.from}
              max={toInputDate(new Date())}
              onChange={(event) => patch({ to: event.target.value || undefined })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Yo&apos;nalish</Label>
            <Select
              value={filters.categoryId ?? ALL}
              onValueChange={(value) =>
                patch({ categoryId: value === ALL ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Barchasi" />
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tez tanlov</Label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { label: "7 kun", days: 7 },
                  { label: "30 kun", days: 30 },
                  { label: "90 kun", days: 90 },
                ] as const
              ).map((preset) => (
                <Button
                  key={preset.days}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    patch({
                      from: daysAgoInput(preset.days),
                      to: toInputDate(new Date()),
                    })
                  }
                >
                  {preset.label}
                </Button>
              ))}
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                  <RotateCcw className="mr-1 size-3" />
                  Tozalash
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══ KO'RSATKICH TANLOVI ════════════════════════════════ */}
      {/*
        ⚠️ TUGMALAR, DROPDOWN EMAS: ko'rsatkich almashtirish bu
        sahifaning ASOSIY harakati va u bir bosishda bo'lishi kerak.
        Dropdown ichida yashirilsa, operator faqat standart
        ko'rsatkichni ko'rib yurardi.
      */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map((item) => {
          const active = item.key === metricKey;
          const value = totals[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setMetricKey(item.key)}
              title={item.hint}
              className={cn(
                "group flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition",
                active
                  ? "border-transparent bg-primary text-primary-foreground shadow-lift"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span
                className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: item.ramp[1] }}
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{item.label}</span>
                <span
                  className={cn(
                    "metric block text-sm font-bold",
                    active ? "text-primary-foreground" : "text-foreground",
                  )}
                >
                  {value}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ══ KATEGORIYA OGOHLANTIRISHI ══════════════════════════ */}
      {report.data?.categoryFiltered &&
      (metricKey === "signals" || metricKey === "signalsNew" || metricKey === "security") ? (
        <div className="flex items-start gap-2 rounded-xl border border-severity-normal/30 bg-severity-normal/10 px-3 py-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-severity-normal" />
          <p className="text-sm">
            <strong>Yo&apos;nalish filtri yoqilgan.</strong> Signal va xavfsizlik
            hodisasida yo&apos;nalish tushunchasi yo&apos;q, shuning uchun bu
            ko&apos;rsatkich hisoblanmadi — xarita bo&apos;sh ko&apos;rinadi.
            Filtrni tozalang yoki murojaat ko&apos;rsatkichiga o&apos;ting.
          </p>
        </div>
      ) : null}

      {report.isError ? (
        <Card>
          <ErrorState
            message={report.error instanceof ApiError ? report.error.message : undefined}
            onRetry={() => void report.refetch()}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ══ XARITA ═══════════════════════════════════════ */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="relative">
                {report.isLoading ? (
                  <div className="aspect-[1000/546] w-full animate-pulse rounded-xl bg-muted" />
                ) : (
                  <>
                    {/*
                      ⚠️ SXEMATIK SVG O'RNIGA HAQIQIY XARITA
                      (2026-11-26): mijoz drill-down'ni HAMMA
                      xaritada so'radi, `DISTRICT_SHAPES` esa qo'lda
                      ajratilgan SVG yo'llari — unda MFY shakllari
                      UMUMAN yo'q va ularni qo'shib bo'lmasdi
                      (viloyat `viewBox` i haqiqiy proyeksiya emas).

                      ⚠️ RANG SHKALASI SAQLANDI (`color` bilan):
                      ko'rsatkich tanlovining butun ma'nosi o'sha
                      gradientda — aks holda oltita ko'rsatkich bir
                      xil ko'rinardi (`leaflet-map.tsx` izohi).
                    */}
                    <MapView
                      center={CENTER}
                      zoom={ZOOM}
                      markers={[]}
                      areas={areas}
                      province={boundaries.data?.province}
                      dark={isDark}
                      className="aspect-[1000/546] w-full overflow-hidden rounded-xl"
                    />

                    {/*
                      ⚠️ YO'LAKCHA FAQAT TUMAN OCHILGANDA: viloyat
                      ko'rinishida qaytadigan joy yo'q.
                    */}
                    {openDistrict ? (
                      <div className="absolute left-2 top-2 z-[400] flex items-center gap-2 rounded-lg bg-card/95 px-2.5 py-1.5 shadow-lift backdrop-blur">
                        <button
                          type="button"
                          onClick={() => setOpenDistrict(null)}
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <ArrowLeft className="size-3.5" />
                          Viloyat
                        </button>
                        <span className="text-xs text-muted-foreground">/</span>
                        <span className="text-xs font-semibold">{openDistrictName}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* ── LEGENDA ─────────────────────────────────── */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Layers className="size-3.5" />
                  {/*
                    ⚠️ DRILL-DOWN DA KO'RSATKICH NOMI O'ZGARADI:
                    tuman ichida MFY lar MUROJAAT soni bo'yicha
                    ranglanadi, tanlangan ko'rsatkich bo'yicha emas
                    (`/reports/mahalla-map` signal va xavfsizlik
                    kesimini bermaydi). Yorliq o'zgarmasa, xodim
                    "signallar" degan rangni MFY kesimi deb o'qirdi.
                  */}
                  {openDistrict ? `${openDistrictName} — MFY lari` : "Tumanlar"}
                </span>

                {/*
                  ⚠️ RANG SHKALASI LEGENDASI OLIB TASHLANDI: rang
                  endi KO'RSATKICH emas, hududning O'ZIGA XOSLIGI
                  (`territory-colors.ts`) va "kam → ko'p" degan
                  shkala xaritadagi ranglarni tushuntirmay,
                  chalg'itardi.

                  ⚠️ KO'RSATKICH O'RNIDA QOLADI: tanlangan
                  kesim yon ustundagi tartiblangan ro'yxatda va
                  plitkalarda ko'rinadi — ya'ni "qayerda ko'p"
                  degan savol javobsiz qolmaydi.
                */}
                <span className="text-[11px] text-muted-foreground">
                  {openDistrict
                    ? "Bosing — son va tafsilot o'ngda"
                    : `${metric.label} — o'ngdagi ro'yxatda`}
                </span>

                {missing.length > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="size-3 rounded bg-muted ring-1 ring-border" />
                    Bazada yo&apos;q ({missing.length})
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* ══ O'NG USTUN: tafsilot yoki reyting ════════════ */}
          <div className="min-h-[24rem]">
            {selected ? (
              <DistrictDetail
                row={selected.row}
                shapeName={selected.name}
                categoryFiltered={report.data?.categoryFiltered ?? false}
                onClose={() => setSelected(null)}
              />
            ) : (
              <Card className="flex h-full flex-col overflow-hidden">
                <div className="border-b border-border p-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {metric.label} bo&apos;yicha
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-8 pl-8 text-sm"
                      placeholder="Tuman qidirish…"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {ranked.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                      {rows.length === 0
                        ? "Tumanlar bazaga kiritilmagan."
                        : "Tuman topilmadi."}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {ranked.map((row, index) => {
                        const value = row[metric.key];
                        const max = ranked[0]![metric.key];
                        return (
                          <li key={row.id}>
                            {/*
                              ⚠️ SICHQONCHA OSTIDAGI TUMANNI
                              YORITISH OLIB TASHLANDI: u sxematik
                              SVG ning `slug` iga bog'langan edi
                              (`DISTRICT_SHAPES`), haqiqiy xarita esa
                              `district.id` bilan ishlaydi. Yarim
                              ishlaydigan holda qoldirilsa, ro'yxatga
                              olib borilgan sichqoncha xaritada hech
                              narsa qilmay, "buzuq" taassurot
                              qoldirardi.
                            */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelected({ row, name: row.name });
                                // ⚠️ RO'YXATDAN BOSISH HAM DRILL-DOWN
                                // OCHADI: xaritada bosish bilan ayni
                                // natija — ikki yo'l bir xil ishlaydi.
                                setOpenDistrict(row.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-secondary"
                            >
                              <span className="metric w-4 shrink-0 text-xs text-muted-foreground">
                                {index + 1}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-medium">
                                  {row.name}
                                  {row.isArchived ? (
                                    <Badge className="ml-1 bg-muted px-1 py-0 text-[9px] text-muted-foreground">
                                      arxiv
                                    </Badge>
                                  ) : null}
                                </span>
                                {/* Nisbiy ustun — ko'z bilan solishtirish uchun. */}
                                <span className="mt-0.5 block h-1 overflow-hidden rounded-full bg-secondary">
                                  <span
                                    className="block h-full rounded-full transition-all"
                                    style={{
                                      width: max > 0 ? `${(value / max) * 100}%` : "0%",
                                      backgroundColor: metric.ramp[1],
                                    }}
                                  />
                                </span>
                              </span>

                              <span className="metric shrink-0 text-sm font-semibold tabular-nums">
                                {value}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Hududi belgilanmagan — xaritada ko'rinmaydi. */}
                {report.data && report.data.unassigned[metric.key] > 0 ? (
                  <div className="border-t border-border px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">
                      <strong className="metric">
                        {report.data.unassigned[metric.key]}
                      </strong>{" "}
                      ta — MFY biriktirilmagan, xaritada ko&apos;rinmaydi.
                    </p>
                  </div>
                ) : null}
              </Card>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
