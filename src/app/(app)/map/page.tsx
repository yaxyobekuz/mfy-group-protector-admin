"use client";

/**
 * XARITA — koordinatali murojaatlar (issiq nuqtalar).
 *
 * ── DIZAYN: XARITA — ORQA FON ───────────────────────────────────────
 *
 * ⚠️ Xarita BUTUN EKRANGA orqa fon bo'lib chiqadi (`document.body` ga
 * portal, `-z-10`), sidebar va kontent uning USTIDA turadi.
 *
 * ── INTERAKTIV LEGENDA ──────────────────────────────────────────────
 *
 * ⚠️ YO'NALISH FILTRI DROPDOWN EMAS, RANGLI LEGENDA: har yo'nalish
 * xaritadagi RANGI, nomi va NUQTALAR SONI bilan chip. Bosib yoqiladi/
 * o'chiriladi — bir vaqtda bir nechta ko'rsatish mumkin (ko'p tanlov).
 *
 * ⚠️ FILTRLASH MIJOZDA: hamma nuqtalar bir marta olinadi, legenda
 * ulardagi MAVJUD turlardan quriladi (soni bilan) va tanlanganlar
 * ko'rsatiladi. Shu tufayli har o'zgarishda yangi so'rov ketmaydi va
 * sonlar darhol ko'rinadi. (Holat filtri esa serverga boradi — u
 * nuqtalar to'plamini o'zgartiradi.)
 *
 * ⚠️ QAMROVGA BO'YSUNADI: server `/reports/map` xodim qamrovi bilan.
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

import { useTheme } from "next-themes";

import { useSession } from "@/entities/session/auth-provider";
import { useMahallaMap, useMapReport } from "@/features/reports/api";
import type { IssueStatus } from "@/shared/api/types";
import { categoryColor, categoryIcon } from "@/shared/config/category-icons";
import { ISSUE_STATUS } from "@/shared/config/labels";
import { cn } from "@/shared/lib/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { EmptyState } from "@/shared/ui/states";
import { MapView } from "@/widgets/issue-map/map-view";
import { MapDetailPanel } from "@/features/issues/map-detail-panel";

const ALL = "__all__";

/** Andijon viloyati markazi (mobil ilova bilan ayni). */
const CENTER: [number, number] = [40.7821, 72.3442];
const ZOOM = 11;

export default function MapPage() {
  const { can } = useSession();
  const [status, setStatus] = useState<IssueStatus | undefined>();
  // ⚠️ `null` — HAMMA turlar ko'rsatiladi (hali hech biri tanlanmagan).
  // To'plam — faqat tanlanganlar; bo'sh to'plam ham "hammasi" demak
  // emas, shuning uchun `null` boshlang'ich holat alohida.
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [mounted, setMounted] = useState(false);

  /**
   * KO'RINISH REJIMI.
   *
   * ⚠️ UCHALASI BIR VAQTDA YOQILMAYDI: nuqtalar, issiqlik va MFY
   * poligonlari birga chizilsa, xarita o'qilmaydigan bo'lib
   * qolardi — har biri BOSHQA savolga javob beradi:
   *   nuqtalar  — "qayerda NIMA bo'ldi"
   *   issiqlik  — "qayerda KO'P"
   *   MFY       — "qaysi MAHALLADA ko'p"
   */
  const [view, setView] = useState<"points" | "heat" | "areas">("points");
  /** Bosilgan markerning murojaat id'si — o'ng panel shundan ochiladi. */
  const [openId, setOpenId] = useState<string | null>(null);

  // ⚠️ `map-page` KLASSI: `main` ni pointer-shaffof qiladi (globals.css)
  // — shunda xaritani move/zoom qilib bo'ladi. Sahifadan chiqilganda
  // olib tashlanadi, aks holda boshqa sahifalarda ham bosib bo'lmasdi.
  useEffect(() => {
    setMounted(true);
    document.body.classList.add("map-page");
    return () => document.body.classList.remove("map-page");
  }, []);

  const points = useMapReport({ status });

  /**
   * ⚠️ MFY KESIMI FAQAT KERAK BO'LGANDA SO'RALADI: javobda
   * poligonlar bor va u og'ir. Nuqtalar rejimida u umuman kerak
   * emas.
   */
  const mahallas = useMahallaMap(view === "points" ? {} : { status });

  /**
   * ⚠️ XARITA PANEL MAVZUSIGA ERGASHADI: oq xarita qorong'i
   * panelda ko'zni qamashtiradi va operator kun bo'yi unga qaraydi.
   *
   * ⚠️ `resolvedTheme`, `theme` EMAS: foydalanuvchi "tizim"
   * rejimini tanlagan bo'lsa, `theme` "system" bo'lib qoladi va
   * xarita har doim oq turardi.
   */
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // ── Xaritadagi MAVJUD yo'nalishlar (soni bilan) — legenda shundan ──
  const legend = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; color: string | null; icon: string | null; count: number }
    >();
    for (const issue of points.data ?? []) {
      const c = issue.category;
      const row = map.get(c.id);
      if (row) row.count += 1;
      else map.set(c.id, { id: c.id, name: c.name, color: c.color, icon: c.icon, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [points.data]);

  // Tanlangan turlar (yoki hammasi) bo'yicha markerlar.
  const markers = useMemo(
    () =>
      (points.data ?? [])
        .filter((issue) => selected === null || selected.has(issue.category.id))
        .map((issue) => ({
          id: issue.id,
          lat: issue.lat,
          lng: issue.lng,
          color: categoryColor(issue.category.color),
          active: openId === issue.id,
          // ⚠️ POPUP O'RNIGA — O'NG PANEL ochiladi.
          onClick: () => setOpenId(issue.id),
        })),
    [points.data, selected, openId],
  );

  /**
   * ISSIQLIK NUQTALARI.
   *
   * ⚠️ IKKI MANBADAN: koordinatali murojaatlar (aniq joy) va MFY
   * markazlari (koordinatasiz murojaatlar uchun). Faqat birinchisi
   * olinsa, botdan kelgan murojaatlar xaritada UMUMAN ko'rinmasdi —
   * holbuki ular ham MFY ga biriktirilgan.
   *
   * ⚠️ YO'NALISH FILTRI IKKALASIGA HAM: legenda tanlovi issiqlik
   * dog'ini ham o'zgartirishi kerak, aks holda chip bosilganda
   * nuqtalar kamayib, issiqlik o'sha-o'sha qolardi.
   */
  const heat = useMemo(() => {
    if (view !== "heat") return [];

    const fromPoints = (points.data ?? [])
      .filter((issue) => selected === null || selected.has(issue.category.id))
      .map((issue) => ({ lat: issue.lat, lng: issue.lng, weight: 1 }));

    const fromMahallas = (mahallas.data ?? [])
      .filter((item) => item.lat !== null && item.lng !== null)
      .map((item) => ({
        lat: item.lat as number,
        lng: item.lng as number,
        weight: countFor(item, selected),
      }))
      .filter((item) => item.weight > 0);

    return [...fromPoints, ...fromMahallas];
  }, [view, points.data, mahallas.data, selected]);

  /** MFY poligonlari/doiralari — tanlangan yo'nalishlar bo'yicha. */
  const areas = useMemo(() => {
    if (view !== "areas") return [];

    return (mahallas.data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      districtName: item.district.name,
      count: countFor(item, selected),
      lat: item.lat,
      lng: item.lng,
      geoJson: item.geoJson,
      isApproximate: item.isApproximate,
    }));
  }, [view, mahallas.data, selected]);

  if (!can("reports.view")) {
    return (
      <EmptyState
        title="Sizda bu bo'limga ruxsat yo'q"
        hint="Xarita hisobot ruxsatini talab qiladi."
      />
    );
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      // null (hammasi) dan bitta chip bosilsa — faqat o'sha qoladi.
      const base = prev ?? new Set(legend.map((l) => l.id));
      const next = new Set(base);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Hammasi tanlangan bo'lsa — `null` ga qaytaramiz ("hammasi").
      return next.size === legend.length ? null : next;
    });
  };

  const isActive = (id: string) => selected === null || selected.has(id);
  const hasPoints = (points.data?.length ?? 0) > 0;

  return (
    <>
      {/* ── XARITA — BODY GA PORTAL, ORQA FON (`-z-10`) ─────────── */}
      {mounted
        ? createPortal(
            <MapView
              center={CENTER}
              zoom={ZOOM}
              // ⚠️ NUQTALAR FAQAT O'Z REJIMIDA: issiqlik ostida
              // yuzlab marker qolsa, dog' ko'rinmay qolardi.
              markers={view === "points" ? markers : []}
              heat={heat}
              areas={areas}
              dark={isDark}
              // ⚠️ `map-root`: globals.css xaritani pointer-auto qiladi
              // (shell zanjiri pointer-shaffof bo'lganда ham). `z-0` —
              // sidebar/panellar `z-1` bilan ustida turadi.
              className="map-root fixed inset-0 z-0 h-screen w-screen"
            />,
            document.body,
          )
        : null}

      {/* ── CHAP USTUN: filtr paneli + legenda ─────────────────── */}
      {/* ⚠️ `pe-auto`: `main` pointer-shaffof, panellar esa bosiladi.
          ⚠️ `w-fit`: panel xarita ustida faqat KERAKLI kenglikni
          egallaydi — aks holda butun qatorni qoplab, uning ostidagi
          xaritani bosib bo'lmasdi. */}
      <div className="flex w-fit flex-wrap items-center gap-2">
        <div className="pe-auto pe-stack flex flex-wrap items-center gap-2 rounded-xl bg-card/95 px-3 py-2 shadow-lift backdrop-blur">
          <h1 className="mr-1 text-base font-semibold tracking-tight">Xarita</h1>

          <Select
            value={status ?? ALL}
            onValueChange={(value) =>
              setStatus(value === ALL ? undefined : (value as IssueStatus))
            }
          >
            <SelectTrigger className="h-9 w-40">
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

          {/*
            ── KO'RINISH REJIMI ─────────────────────────────

            ⚠️ UCHTA TUGMA, DROPDOWN EMAS: rejim xaritaning
            MA'NOSINI o'zgartiradi va operator uni bir qarashda
            ko'rib turishi kerak. Ro'yxat ichiga yashirilsa, u
            "issiqlik xaritasi bormi" degan savolga javob
            izlamasdi.
          */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {(
              [
                ["points", "Nuqtalar"],
                ["heat", "Issiqlik"],
                ["areas", "MFY"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition",
                  view === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="px-1 text-sm text-muted-foreground">
            {view === "areas"
              ? `${areas.filter((area) => area.count > 0).length} / ${areas.length} ta MFY`
              : `${markers.length} / ${points.data?.length ?? 0} ta nuqta`}
          </span>
        </div>
      </div>

      {/* ── INTERAKTIV LEGENDA — yo'nalish bo'yicha filtr ──────── */}
      {legend.length > 0 ? (
        <div className="pe-auto pe-stack mt-3 max-w-[20rem] rounded-xl bg-card/95 p-2.5 shadow-lift backdrop-blur">
          <div className="mb-1.5 flex items-center justify-between px-1">
            {/*
              ⚠️ LEGENDA UCHALA REJIMDA HAM ISHLAYDI: mijoz "har
              yo'nalish bo'yicha MFY kesimida filtr" so'ragan — ya'ni
              chip bosilganda nuqtalar ham, issiqlik ham, MFY ranglari
              ham o'zgaradi.
            */}
            <p className="text-xs font-semibold text-muted-foreground">
              Yo&apos;nalish bo&apos;yicha
            </p>
            {selected !== null ? (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Hammasi
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {legend.map((item) => {
              const Icon = categoryIcon(item.icon);
              const color = categoryColor(item.color);
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition",
                    active
                      ? "border-transparent text-foreground"
                      : "border-border bg-transparent text-muted-foreground opacity-60",
                  )}
                  style={active ? { backgroundColor: `${color}1f` } : undefined}
                >
                  <span
                    className="flex size-4 items-center justify-center rounded-full"
                    style={{ backgroundColor: active ? color : "transparent", color: active ? "#fff" : color }}
                  >
                    {active ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : (
                      <Icon className="size-3" />
                    )}
                  </span>
                  <span className="font-medium">{item.name}</span>
                  <span className="tabular-nums text-muted-foreground">{item.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── O'NG PANEL: bosilgan murojaat tafsiloti ────────────── */}
      {openId ? (
        <MapDetailPanel issueId={openId} onClose={() => setOpenId(null)} />
      ) : null}

      {/*
        ⚠️ MATN REJIMGA QARAB: "koordinatali murojaat yo'q" degan
        xabar MFY rejimida chalg'ituvchi bo'lardi — u yerda
        koordinata umuman kerak emas, MFY biriktirilishi yetarli.
      */}
      {view === "areas" && areas.length > 0 && areas.every((a) => a.count === 0) ? (
        <div className="pointer-events-none mt-3 flex">
          <p className="pointer-events-auto rounded-full bg-card/95 px-4 py-2 text-sm text-muted-foreground shadow-md backdrop-blur">
            Bu kesimda murojaat yo&apos;q
          </p>
        </div>
      ) : view !== "areas" && !hasPoints && !points.isLoading ? (
        <div className="pointer-events-none mt-3 flex">
          <p className="pointer-events-auto rounded-full bg-card/95 px-4 py-2 text-sm text-muted-foreground shadow-md backdrop-blur">
            Koordinatali murojaat yo&apos;q — fuqaro ilovada joyni belgilaganda ko&apos;rinadi
          </p>
        </div>
      ) : null}
    </>
  );
}

/**
 * MFY NING TANLANGAN YO'NALISHLAR BO'YICHA SONI.
 *
 * ⚠️ FILTR MIJOZDA: server har MFY ning har yo'nalish bo'yicha
 * sonini beradi (`byCategory`) va chip bosilganda yangi so'rov
 * KETMAYDI — aks holda har bosishda og'ir (poligonli) javob qayta
 * yuklanardi.
 *
 * ⚠️ `null` — HAMMASI: tanlov hali qilinmagan holat bo'sh
 * to'plamdan FARQ QILADI (`map/page.tsx` dagi `selected` izohi).
 */
const countFor = (
  item: { total: number; byCategory: Record<string, number> },
  selected: Set<string> | null,
): number => {
  if (selected === null) return item.total;

  let sum = 0;
  for (const id of selected) sum += item.byCategory[id] ?? 0;
  return sum;
};
