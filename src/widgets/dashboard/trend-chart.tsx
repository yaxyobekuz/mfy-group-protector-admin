"use client";

/**
 * DINAMIKA — 14 kunlik murojaat oqimi (maydon + chiziq).
 *
 * ⚠️ IKKI SERIYA, BITTA O'Q: "jami" va "hal qilingan" AYNI
 * birlikda (dona) o'lchanadi, shuning uchun ular bitta shkalada
 * taqqoslanadi. Ikkinchi o'q qo'shilsa, ikki chiziq nisbati
 * shkalalar tanloviga bog'liq bo'lib, istalgan xulosani
 * "chizib" bo'lardi.
 *
 * ⚠️ LEGENDA MAJBURIY: diagramma ranglari daltonikda yaqin
 * (chart-colors.ts dagi ogohlantirish) — seriyani FAQAT rang
 * ajratmasligi kerak.
 *
 * ⚠️ `resolvedTheme` SERVERDA `undefined`: standart YORUG',
 * aks holda birinchi render tungi ranglarda chizilib, keyin
 * almashardi ("miltillash").
 */

import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyPoint } from "@/shared/api/types";
import {
  chartAxisColor,
  chartColors,
  chartGridColor,
  chartTooltipStyle,
} from "@/shared/config/chart-colors";
import { formatDateUz } from "@/shared/lib/date";

export const TrendChart = ({ data }: { data: DailyPoint[] }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = chartColors(isDark);

  const rows = data.map((point) => ({
    ...point,
    // ⚠️ O'QDA QISQA SANA: to'liq format ("21-may, 2025") 14 ta
    // nuqtada bir-birining ustiga chiqib ketardi. Tooltipda esa
    // to'liq sana ko'rsatiladi — u bitta va joy yetarli.
    short: formatDateUz(point.date).replace(/,.*$/, ""),
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            {/* ⚠️ GRADIENT — MAYDONNI YENGILLASHTIRADI: to'liq
                to'ldirilgan ikki maydon ustma-ust tushib, pastki
                seriya o'qilmay qolardi. */}
            <linearGradient id="dash-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette[2]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={palette[2]} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="dash-resolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette[0]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={palette[0]} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartGridColor(isDark)}
            vertical={false}
          />
          <XAxis
            dataKey="short"
            tick={{ fontSize: 11, fill: chartAxisColor(isDark) }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 11, fill: chartAxisColor(isDark) }}
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={chartTooltipStyle(isDark)}
            labelFormatter={(_label, payload) => {
              const row = payload?.[0]?.payload as DailyPoint | undefined;
              return row ? formatDateUz(row.date) : "";
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />

          <Area
            type="monotone"
            dataKey="total"
            name="Jami"
            stroke={palette[2]}
            strokeWidth={2}
            fill="url(#dash-total)"
          />
          <Area
            type="monotone"
            dataKey="resolved"
            name="Hal qilingan"
            stroke={palette[0]}
            strokeWidth={2}
            fill="url(#dash-resolved)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
