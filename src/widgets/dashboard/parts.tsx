"use client";

/**
 * BOSHQARUV PANELINING KICHIK QURILISH BLOKLARI.
 *
 * ⚠️ TO'RT TABDA HAM AYNI SHAKLLAR ISHLATILADI (`overview-tab`,
 * `issues-tab`, `signals-tab`): har tabda qaytarilsa, bittasining
 * o'lchami yoki rangi o'zgarib, tablar bir-biridan ajralib
 * ketardi — holbuki ular BITTA sahifaning qismlari va xodim
 * ular orasida sekundda o'tadi.
 *
 * ⚠️ `StatTile` DAN FARQI: bular KARTA EMAS va havola ham emas —
 * ular karta ICHIDA, boshqa ko'rsatkichlar bilan yonma-yon
 * turadi. `StatTile` esa o'z kartasi bilan to'rda turadigan
 * plitka.
 */

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

type Tone = "default" | "primary" | "danger" | "warning";

const TONE_TEXT: Record<Tone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  danger: "text-destructive",
  warning: "text-severity-normal",
};

/**
 * YIRIK KO'RSATKICH — diagramma ustidagi qator uchun.
 *
 * ⚠️ RAQAM DIAGRAMMADAN KATTA: grafik YO'NALISHNI ko'rsatadi,
 * raqam esa ANIQ qiymatni va operatorga ikkalasi ham kerak.
 */
export const Metric = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: Tone;
}) => (
  <div>
    <p className="mb-1 text-xs text-muted-foreground">{label}</p>
    <p className={cn("metric text-3xl font-semibold", TONE_TEXT[tone])}>{value}</p>
  </div>
);

/**
 * IXCHAM KO'RSATKICH — belgisi bilan, to'rtlik qatorda.
 *
 * ⚠️ `href` IXTIYORIY: havolasiz ko'rsatkichda strelka ham,
 * sichqoncha ta'siri ham bo'lmaydi — aks holda bosib ko'rgan
 * odam hech narsa ochilmaganini ko'rib, panelni "buzuq" deb
 * o'ylardi.
 */
export const MiniStat = ({
  icon: Icon,
  label,
  value,
  tone = "default",
  href,
}: {
  icon?: LucideIcon;
  label: string;
  value: number | string;
  tone?: Tone;
  href?: string;
}) => {
  const body = (
    <>
      {/*
        ⚠️ YORLIQ QIRQILMAYDI, IKKI QATORGA O'TADI (`line-clamp-2`,
        `truncate` EMAS): yarim kenglikdagi kartada ikki ustunli
        to'rda "O'chirilgan xabar" → "O'chirilgan x…" bo'lib
        qirqilardi va qaysi son nimani anglatishi bilinmasdi.

        ⚠️ `items-start`: yorliq ikki qatorli bo'lganda belgi
        BIRINCHI qator bilan bir sathda qolishi kerak, o'rtada
        osilib qolmasligi.
      */}
      <div className="mb-2 flex items-start gap-2">
        {Icon ? (
          <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        ) : null}
        <p className="line-clamp-2 text-xs leading-tight text-muted-foreground">
          {label}
        </p>
      </div>
      <p className={cn("metric text-2xl font-semibold", TONE_TEXT[tone])}>{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl bg-secondary/50 p-3.5 transition-colors hover:bg-secondary"
      >
        {body}
      </Link>
    );
  }

  return <div className="rounded-xl bg-secondary/50 p-3.5">{body}</div>;
};

/**
 * YORLIQ — RAQAM QATORI.
 *
 * ⚠️ IZOH MAYDONI YO'Q va bu ataylab olib tashlandi: qator
 * yorlig'i o'zi tushunarli bo'lishi kerak. Izoh kerak bo'lsa,
 * demak yorliq noto'g'ri tanlangan.
 */
export const StatRow = ({
  label,
  value,
  tone = "default",
  href,
}: {
  label: string;
  value: number | string;
  tone?: Tone;
  href?: string;
}) => {
  const content = (
    <>
      <span className="min-w-0 truncate">{label}</span>
      <span className={cn("tabular shrink-0 font-semibold", TONE_TEXT[tone])}>
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-secondary"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">{content}</div>
  );
};

/**
 * MA'LUMOT YO'Q — KARTA ICHIDA.
 *
 * ⚠️ `EmptyState` DAN FARQI: u BUTUN SAHIFA uchun (belgi,
 * sarlavha, izoh), bu esa kartaning ichidagi bitta diagramma
 * yoki ro'yxat uchun — to'liq bo'sh holat kartani cho'zib
 * yuborardi.
 */
export const NoData = ({ text = "Hali ma'lumot yo'q" }: { text?: string }) => (
  <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>
);
