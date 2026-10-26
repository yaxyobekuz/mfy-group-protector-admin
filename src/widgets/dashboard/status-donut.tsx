"use client";

/**
 * MUROJAAT HOLATLARI — HALQA (donut).
 *
 * ⚠️ HALQA TANLANDI, DUMALOQ (pie) EMAS: o'rtadagi bo'shliqqa
 * JAMI raqami qo'yiladi va u "nechta murojaat bor" degan eng
 * ko'p so'raladigan savolga darhol javob beradi. Dumaloqda bu
 * joy behuda ketardi.
 *
 * ⚠️ TO'RT BO'LAK — CHEGARA: halqa faqat kam sonli, bir-birini
 * TO'LDIRADIGAN qismlar uchun. Murojaat bir vaqtda faqat bitta
 * holatda bo'ladi, ya'ni ular haqiqatan 100% ni tashkil qiladi.
 * Kategoriyalar uchun esa ustunli diagramma ishlatiladi —
 * ular ko'p va halqada o'qib bo'lmasdi.
 *
 * ⚠️ YORLIQ RANG BILAN EMAS, MATN BILAN: o'ngdagi ro'yxatda
 * har holat nomi va raqami YOZILGAN. Rang faqat qo'shimcha
 * belgi — daltonikda ikki bo'lak qo'shilib ketsa ham ma'lumot
 * yo'qolmaydi.
 */

import { useTheme } from "next-themes";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { IssueStatus } from "@/shared/api/types";
import { chartTooltipStyle, statusChartColors } from "@/shared/config/chart-colors";
import { ISSUE_STATUS } from "@/shared/config/labels";

/** ⚠️ TARTIB — HAYOTIY YO'L: yangi → ko'rilmoqda → yopilgan. */
const ORDER: IssueStatus[] = ["new", "in_progress", "resolved", "rejected"];

export const StatusDonut = ({
  counts,
}: {
  counts: Record<IssueStatus, number> | undefined;
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = statusChartColors(isDark);

  const rows = ORDER.map((status) => ({
    status,
    name: ISSUE_STATUS[status].label,
    value: counts?.[status] ?? 0,
    color: colors[status],
  }));

  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="flex items-center gap-4">
      {/* ── Halqa ──────────────────────────────────────────── */}
      <div className="relative size-[132px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              innerRadius={44}
              outerRadius={64}
              // ⚠️ 2px ORALIQ: qo'shni bo'laklar bir-biriga
              // tegib tursa, chegara qayerda ekani bilinmasdi.
              paddingAngle={2}
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {rows.map((row) => (
                <Cell key={row.status} fill={row.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle(isDark)} />
          </PieChart>
        </ResponsiveContainer>

        {/* ⚠️ MARKAZDAGI RAQAM — `pointer-events-none`: aks holda
            u halqa ustidagi tooltipni to'sib qo'yardi. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="metric text-2xl font-semibold leading-none">{total}</p>
          <p className="mt-1 text-[0.6875rem] text-muted-foreground">jami</p>
        </div>
      </div>

      {/* ── Yorliqlar — RANG EMAS, MATN ────────────────────── */}
      <ul className="min-w-0 flex-1 space-y-2">
        {rows.map((row) => (
          <li key={row.status} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {row.name}
            </span>
            <span className="tabular font-semibold">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
