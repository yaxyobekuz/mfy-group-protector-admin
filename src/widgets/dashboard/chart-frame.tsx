"use client";

/**
 * BENTO KATAKCHASI — diagramma uchun karta qobig'i.
 *
 * ⚠️ BARCHA KATAKCHALAR BITTA QOBIQDAN: sarlavha o'lchami,
 * ichki bo'shliq va havola joylashuvi bir xil bo'lishi kerak.
 * Har kartada qo'lda yozilsa, bento to'ri "yamoq" bo'lib
 * ko'rinardi — bu uslubning butun ma'nosi tartibda.
 *
 * ⚠️ BALANDLIK KARTADA EMAS, DIAGRAMMADA: karta mazmuniga qarab
 * o'sadi, diagramma esa aniq balandlik oladi (`ResponsiveContainer`
 * foizli balandlikda ota-element balandligini TALAB qiladi va
 * usiz 0 bo'lib, hech narsa chizilmasdi).
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card";

interface Props {
  title: string;
  /** Sarlavha ostidagi bir qatorli izoh — nimani o'lchaydi. */
  subtitle?: string;
  /** O'ng yuqoridagi havola ("Batafsil"). */
  href?: string;
  hrefLabel?: string;
  /** Sarlavha qatoriga qo'yiladigan qo'shimcha (masalan, yirik raqam). */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const ChartFrame = ({
  title,
  subtitle,
  href,
  hrefLabel = "Batafsil",
  action,
  className,
  children,
}: Props) => (
  <Card className={cn("flex h-full flex-col overflow-hidden", className)}>
    <div className="flex items-start justify-between gap-3 p-5 pb-3">
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {action}

      {href ? (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {hrefLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      ) : null}
    </div>

    {/* ⚠️ `min-h-0`: flex bolasi standart holda mazmunidan
        kichiklasha olmaydi va diagramma kartadan toshib ketardi. */}
    <div className="min-h-0 flex-1 px-5 pb-5">{children}</div>
  </Card>
);
