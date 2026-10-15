import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * ⚠️ RANG TASHQARIDAN KELADI (`className`), variant sifatida
 * e'lon qilinmaydi. Sabab: holat ranglari `config/labels.ts` da
 * yagona manbada yashaydi va ularni bu yerda IKKINCHI marta
 * e'lon qilish ikki joyda haqiqat yaratardi.
 */
export const Badge = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      // ⚠️ `rounded-full` — panel tilida yorliq "tabletka".
      //
      // ⚠️ `whitespace-nowrap`: yorliq tor jadval ustunida IKKI
      // QATORGA bo'linib ketardi ("Hal\nqilindi") va tabletka
      // shakli buzilardi.
      "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
      "bg-secondary text-secondary-foreground",
      className,
    )}
    {...props}
  />
);
