import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import { Card, CardContent } from "@/shared/ui/card";

/**
 * KO'RSATKICH PLITKASI.
 *
 * ⚠️ RAQAM `tabular-nums` BILAN: plitkalar yonma-yon turganda
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
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "danger" | "success";
  href?: string;
}) => {
  const toneClass = {
    default: "text-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
    success: "text-emerald-600 dark:text-emerald-400",
  }[tone];

  const content = (
    <CardContent className="space-y-1 p-4">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="size-3.5 text-muted-foreground" /> : null}
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>

      <p className={cn("tabular text-2xl font-semibold leading-none", toneClass)}>
        {value}
      </p>

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </CardContent>
  );

  // ⚠️ HAVOLALI PLITKA `hover` BERADI: usiz foydalanuvchi uning
  // bosiladiganini bilmasdi.
  if (href) {
    return (
      <Card className="transition-colors hover:bg-muted/40">
        <Link href={href}>{content}</Link>
      </Card>
    );
  }

  return <Card>{content}</Card>;
};
