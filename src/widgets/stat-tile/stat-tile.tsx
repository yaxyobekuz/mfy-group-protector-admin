import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card";

/**
 * KO'RSATKICH PLITKASI.
 *
 * ⚠️ RAQAM — PLITKANING MAZMUNI, shuning uchun u YIRIK (`text-5xl`)
 * va yorliq undan kichik. Avval ikkisi bir o'lchamda edi va
 * operator ekranga qarab darhol "nechta" ekanini ayta olmasdi.
 *
 * ⚠️ `tabular` (`.metric`): plitkalar yonma-yon turganda
 * proporsional raqamlar har xil kenglikda bo'lib, qator "sakrab"
 * ko'rinardi.
 *
 * ⚠️ `tone` FAQAT E'TIBOR KERAK BO'LGANDA ishlatiladi (muddati
 * o'tgan, yuqori jiddiylik). Hamma plitka rangli bo'lsa, rang
 * ma'nosini yo'qotadi.
 */
export const StatTile = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
  featured = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "danger" | "success";
  href?: string;
  /**
   * ⚠️ BITTA PLITKA TO'LDIRILADI. Ikkitasi to'ldirilsa "qaysi
   * biri muhim" degan savol tug'ilardi va ta'kid yo'qolardi.
   */
  featured?: boolean;
}) => {
  const toneClass = featured
    ? "text-primary-foreground"
    : {
        default: "text-foreground",
        warning: "text-severity-normal",
        danger: "text-destructive",
        success: "text-primary",
      }[tone];

  /*
   * ⚠️ `gap-5` + `justify-start`, `justify-between` EMAS: qatorda
   * `hint` bor va yo'q plitkalar aralash turadi va "yoyib yuborish"
   * ularni har xil balandlikda ko'rsatardi — raqam birida tepada,
   * birida pastda qolib, qator tartibsiz ko'rinardi.
   */
  const body = (
    // ⚠️ TELEFONDA IXCHAMROQ (`gap-3`/`p-4`): to'liq o'lchamda
    // to'rtta plitka ekranni to'ldirib, ularni ko'rish uchun uzoq
    // aylantirish kerak bo'lardi.
    <div className="flex h-full flex-col gap-3 p-4 sm:gap-5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon
              className={cn(
                "size-4 shrink-0",
                featured ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            />
          ) : null}
          <p
            className={cn(
              "text-sm font-medium",
              featured ? "text-primary-foreground/90" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
        </div>

        {/*
          ⚠️ STRELKA FAQAT HAVOLADA: u "bu yerga o'tish mumkin"
          degan belgi va havolasiz plitkada yolg'on va'da bo'lardi.
        */}
        {href ? (
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full transition-colors",
              featured
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground",
            )}
          >
            <ArrowUpRight className="size-3.5" />
          </span>
        ) : null}
      </div>

      {/*
        ⚠️ `mt-auto`: `hint` bo'lmasa ham raqam plitkaning PASTIGA
        tayanadi — shunda qo'shni plitkalar bilan bir sathda turadi.
      */}
      <div className="mt-auto space-y-1.5">
        <p className={cn("metric text-4xl font-semibold sm:text-5xl", toneClass)}>
          {value}
        </p>

        {hint ? (
          <p
            className={cn(
              "text-xs",
              featured ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );

  const card = (
    <Card
      interactive={Boolean(href)}
      className={cn(
        "h-full overflow-hidden",
        featured && "border-transparent bg-primary text-primary-foreground",
      )}
    >
      {body}
    </Card>
  );

  // ⚠️ HAVOLALI PLITKA `hover` BERADI: usiz foydalanuvchi uning
  // bosiladiganini bilmasdi. `group` — strelka rangi uchun.
  if (href) {
    return (
      <Link href={href} className="group block h-full rounded-2xl">
        {card}
      </Link>
    );
  }

  return card;
};
