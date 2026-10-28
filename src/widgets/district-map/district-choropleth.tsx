"use client";

/**
 * TUMANLAR XARITASI — choropleth (rang = daraja).
 *
 * ⚠️ RANG — NISBIY, MUTLAQ EMAS: eng band tuman eng to'q bo'ladi.
 * Qat'iy chegaralar (0-10 och, 10-50 o'rta...) qo'yilsa, kichik
 * viloyatda hamma tuman bir xil och bo'lib, xarita hech narsa
 * ko'rsatmay qolardi. Shuning uchun shkala MAVJUD eng katta
 * qiymatga moslashadi va legendada SONLAR bilan yoziladi — aks
 * holda "to'q qizil" nimani bildirishini hech kim bilmasdi.
 *
 * ⚠️ NOL — KULRANG, ENG OCH RANG EMAS: "hech narsa yo'q" va "eng
 * kam" ikki boshqa holat. Bitta shkalaga qo'yilsa, murojaat
 * kelmagan tuman "kam muammoli" bo'lib ko'rinardi.
 *
 * ⚠️ BAZADA YO'Q TUMAN — SHTRIXLANGAN: viloyat xaritasi 15 ta
 * tumandan iborat, lekin bazaga ularning bir qismi kiritilgan
 * bo'lishi mumkin. Bunday tumanni UMUMAN ko'rsatmaslik xaritada
 * tuynuk ochardi, "0" deb ko'rsatish esa YOLG'ON bo'lardi — ular
 * ataylab uchinchi holatda.
 */

import { useMemo } from "react";

import {
  DISTRICT_SHAPES,
  MAP_VIEWBOX,
  SHAPE_ALIASES,
  normalizeName,
  type DistrictShape,
} from "@/shared/config/district-shapes";
import type { DistrictMapRow } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";

/** Xaritada ko'rsatiladigan ko'rsatkich. */
export type MapMetric =
  | "issues"
  | "open"
  | "overdue"
  | "signals"
  | "signalsNew"
  | "security";

export interface MetricDef {
  key: MapMetric;
  label: string;
  /** Qisqa izoh — legendada va tanlovda. */
  hint: string;
  /** Shkala rangi (eng to'q uch). */
  ramp: [string, string];
}

/**
 * ⚠️ HAR OQIM O'Z RANG OILASI BILAN: muammo — binafsha, signal —
 * havorang, xavfsizlik — qizil. Hammasi bitta rangda bo'lsa,
 * ko'rsatkich almashganda ekran o'zgarmaganday tuyulardi.
 */
export const METRICS: MetricDef[] = [
  {
    key: "issues",
    label: "Murojaatlar",
    hint: "Jami murojaat soni",
    ramp: ["#ede9fe", "#5b21b6"],
  },
  {
    key: "open",
    label: "Ochiq murojaat",
    hint: "Yangi + ko'rib chiqilmoqda",
    ramp: ["#e0f2fe", "#075985"],
  },
  {
    key: "overdue",
    label: "Muddati o'tgan",
    hint: "Yopilmagan va muddati o'tib ketgan",
    ramp: ["#ffedd5", "#9a3412"],
  },
  {
    key: "signals",
    label: "Signallar",
    hint: "AI topgan signallar (taxmin)",
    ramp: ["#cffafe", "#155e75"],
  },
  {
    key: "signalsNew",
    label: "Ko'rilmagan signal",
    hint: "Hali odam qaror qilmagan",
    ramp: ["#fef9c3", "#854d0e"],
  },
  {
    key: "security",
    label: "Xavfsizlik",
    hint: "O'chirilgan zararli xabarlar",
    ramp: ["#fee2e2", "#991b1b"],
  },
];

/** Bazadagi tumanni xaritadagi shaklga moslaydi. */
const matchRow = (
  shape: DistrictShape,
  rows: DistrictMapRow[],
): DistrictMapRow | undefined => {
  const aliases = SHAPE_ALIASES[shape.slug] ?? [shape.slug];
  const wanted = new Set([...aliases, normalizeName(shape.name)]);

  return rows.find((row) => {
    // ⚠️ NOM BO'YICHA, KOD BO'YICHA EMAS: kodni panelda odam yozadi
    // va u ixtiyoriy ("and-sh", "02"). Nom esa rasmiy va barqaror.
    const byName = normalizeName(row.name);
    if (wanted.has(byName)) return true;
    // Kod ham tekshiriladi — moslik topilsa, foyda.
    return wanted.has(normalizeName(row.code));
  });
};

/** Chiziqli interpolyatsiya ikki hex rang orasida. */
const mix = (from: string, to: string, t: number): string => {
  const parse = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const c = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)})`;
};

export interface MappedDistrict {
  shape: DistrictShape;
  row: DistrictMapRow | undefined;
  value: number;
  /** 0..1 — shkaladagi o'rni (`max` ga nisbatan). */
  intensity: number;
}

export const DistrictChoropleth = ({
  rows,
  metric,
  selectedId,
  hoveredSlug,
  onHover,
  onSelect,
  className,
}: {
  rows: DistrictMapRow[];
  metric: MetricDef;
  selectedId?: string | null;
  hoveredSlug?: string | null;
  onHover?: (slug: string | null) => void;
  onSelect?: (row: DistrictMapRow | undefined, shape: DistrictShape) => void;
  className?: string;
}) => {
  const mapped = useMemo<MappedDistrict[]>(() => {
    const withRows = DISTRICT_SHAPES.map((shape) => {
      const row = matchRow(shape, rows);
      return { shape, row, value: row ? row[metric.key] : 0, intensity: 0 };
    });

    const max = Math.max(...withRows.map((item) => item.value), 0);

    return withRows.map((item) => ({
      ...item,
      /*
       * ⚠️ KVADRAT ILDIZ (`sqrt`), CHIZIQLI EMAS: bitta tumanda 200,
       * qolganlarida 5 ta bo'lsa, chiziqli shkalada hammasi deyarli
       * oq bo'lib, faqat bittasi ko'rinardi. Ildiz kichik
       * qiymatlarni ham ajratadi, tartibni esa buzmaydi.
       */
      intensity: max > 0 && item.value > 0 ? Math.sqrt(item.value / max) : 0,
    }));
  }, [rows, metric.key]);

  return (
    <svg
      viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
      className={cn("h-auto w-full select-none", className)}
      role="img"
      aria-label={`Andijon viloyati — ${metric.label} bo'yicha xarita`}
    >
      <defs>
        {/* Bazada yo'q tumanlar uchun shtrix. */}
        <pattern
          id="dm-missing"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="7" height="7" className="fill-muted" />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="7"
            className="stroke-muted-foreground/40"
            strokeWidth="2"
          />
        </pattern>

        <filter id="dm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1.5"
            stdDeviation="2.5"
            floodColor="#0f172a"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      {mapped.map(({ shape, row, value, intensity }) => {
        const missing = !row;
        const isSelected = Boolean(row && selectedId === row.id);
        const isHovered = hoveredSlug === shape.slug;

        const fill = missing
          ? "url(#dm-missing)"
          : value === 0
            ? "hsl(var(--dm-zero))"
            : mix(metric.ramp[0], metric.ramp[1], intensity);

        return (
          <g
            key={shape.slug}
            className={cn(
              "transition-[filter,opacity]",
              !missing && "cursor-pointer",
            )}
            filter={isSelected || isHovered ? "url(#dm-shadow)" : undefined}
            onMouseEnter={() => onHover?.(shape.slug)}
            onMouseLeave={() => onHover?.(null)}
            onClick={() => !missing && onSelect?.(row, shape)}
          >
            <path
              d={shape.d}
              fill={fill}
              className={cn(
                "transition-[stroke,stroke-width,fill] duration-150",
                isSelected
                  ? "stroke-foreground"
                  : isHovered
                    ? "stroke-foreground/70"
                    : "stroke-background",
              )}
              strokeWidth={isSelected ? 3 : isHovered ? 2.4 : 1.4}
              strokeLinejoin="round"
            />

            {/*
              ⚠️ YORLIQ BITTA ELEMENT, IKKITA EMAS (`paintOrder`):
              choroplethda fon to'qdan ochgacha o'zgaradi va bitta
              rangli matn yo to'q, yo och fonda o'qilmay qolardi.
              `paint-order: stroke` chekkani matn OSTIGA chizadi,
              shuning uchun bitta element yetarli — avval ikkita
              `<text>` ustma-ust qo'yilgandi va ular hover'da bir
              piksel siljib, matn "qalqib" ko'rinardi.

              ⚠️ CHEKKA `stroke-card` (oq emas): tungi rejimda oq
              halo yorliqlarni stikerga o'xshatib qo'yardi.
            */}
            <text
              x={shape.cx}
              y={shape.cy}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none fill-foreground stroke-card"
              fontSize={isHovered || isSelected ? 13 : 12}
              fontWeight={600}
              strokeWidth={3.5}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {shape.name}
            </text>

            {/* Qiymat — nom ostida, faqat bazada bor tumanlarda. */}
            {!missing ? (
              <text
                x={shape.cx}
                y={shape.cy + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none fill-foreground stroke-card"
                fontSize={12}
                fontWeight={700}
                strokeWidth={3.5}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {value}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

/**
 * LEGENDA BOSQICHLARI.
 *
 * ⚠️ BUTUN SONLAR VA TAKRORLANMAYDI: avval bosqichlar
 * `max/steps` dan hisoblanardi va `max` kichik bo'lganda (1-2 ta
 * murojaat) "1–0", "0–1" kabi MA'NOSIZ oraliqlar chiqardi.
 * Endi oraliqlar butun songa yaxlitlanadi va bir-birining ustiga
 * tushganlari TASHLANADI — shuning uchun `max=1` bo'lganda
 * legendada bitta "1" turadi, to'rtta chalkash oraliq emas.
 */
export const buildLegend = (
  rows: DistrictMapRow[],
  metric: MetricDef,
): { color: string; from: number; to: number }[] => {
  const max = Math.max(...rows.map((row) => row[metric.key]), 0);
  if (max <= 0) return [];

  const steps = Math.min(4, max);
  const out: { color: string; from: number; to: number }[] = [];
  let prevTo = 0;

  for (let index = 0; index < steps; index += 1) {
    const to = Math.round((max / steps) * (index + 1));
    const from = prevTo + 1;
    // Oraliq bo'sh bo'lib qolsa (yaxlitlash tufayli) — o'tkazamiz.
    if (to < from) continue;
    out.push({
      color: mix(metric.ramp[0], metric.ramp[1], Math.sqrt(to / max)),
      from,
      to,
    });
    prevTo = to;
  }

  return out;
};
