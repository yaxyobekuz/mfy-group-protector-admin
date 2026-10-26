"use client";

/**
 * YO'NALISHLAR — TARTIBLANGAN USTUNLAR (gorizontal).
 *
 * ⚠️ GORIZONTAL, VERTIKAL EMAS: yo'nalish nomlari uzun
 * ("Kommunal xizmatlar", "Yo'l infratuzilmasi") va vertikal
 * ustunlarda ular yo qiyshaytirilardi, yo qisqartirilardi —
 * ikkalasi ham o'qishni qiyinlashtiradi.
 *
 * ⚠️ `recharts` ISHLATILMAYDI — SOF CSS: bu oddiy tartiblangan
 * ro'yxat va kutubxonaning o'qlari, tooltipi, shkalasi bu yerda
 * ortiqcha. Dinamika va halqa uchun u o'rinli (vaqt shkalasi,
 * burchak hisobi), bu yerda esa nisbat bitta bo'lish amali.
 *
 * ⚠️ RANG YO'NALISHNING O'ZIDAN (`category.color`): u butun
 * panelda (xarita nuqtasi, rozetka, ilova) AYNI rangda
 * ko'rinadi. Ro'yxatdagi O'RNIGA qarab berilsa, filtr
 * o'zgarganda ranglar sakrab ketardi.
 *
 * ⚠️ RAQAM HAR QATORDA YOZILGAN: ustun uzunligi — taqqoslash
 * uchun, aniq qiymat esa o'qish uchun. Faqat ustun qolsa,
 * "27 mi yoki 31 mi" degan savolga javob bo'lmasdi.
 */

import Link from "next/link";

import { categoryColor, categoryIcon } from "@/shared/config/category-icons";

interface Row {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  count: number;
}

export const CategoryBars = ({ rows, limit = 6 }: { rows: Row[]; limit?: number }) => {
  const top = [...rows].sort((a, b) => b.count - a.count).slice(0, limit);
  // ⚠️ KAMIDA 1: bo'sh ma'lumotda nolga bo'lish `NaN` kenglik
  // berardi va ustunlar umuman chizilmasdi.
  const max = Math.max(1, ...top.map((row) => row.count));

  if (top.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Hali ma&apos;lumot yo&apos;q
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {top.map((row) => {
        const Icon = categoryIcon(row.icon);
        const color = categoryColor(row.color);

        return (
          <li key={row.id}>
            <Link
              href={`/issues?categoryId=${row.id}`}
              className="group block rounded-lg transition-colors"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  <Icon className="size-3" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm group-hover:text-foreground">
                  {row.name}
                </span>
                <span className="tabular shrink-0 text-sm font-semibold">
                  {row.count}
                </span>
              </div>

              {/* ⚠️ YO'LAK (`bg-secondary`) QOLADI: usiz qisqa
                  ustun "ma'lumot yo'q" dek ko'rinardi — endi u
                  "to'liqning qanchasi" ekani ko'rinadi. */}
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${Math.max(2, (row.count / max) * 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
