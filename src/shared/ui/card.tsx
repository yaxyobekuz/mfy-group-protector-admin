import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * KARTA — panelning asosiy qurilish bloki.
 *
 * ⚠️ CHEGARA EMAS, SOYA. Karta yumshoq fon ustida "suzadi"
 * (`--shadow-card`). To'q chegara bilan u quti bo'lib ko'rinib,
 * ekranda o'nta quti yonma-yon turganda panel jadvalga
 * o'xshab qolardi.
 *
 * ⚠️ TUNDA CHEGARA QAYTADI (`dark:border`): to'q fonda soya
 * KO'RINMAYDI va kartani faqat `--card` ning fondan farqi
 * ajratadi — u esa yetarli emas.
 */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl bg-card text-card-foreground shadow-card",
      "border border-transparent dark:border-border",
      // ⚠️ FAQAT BOSILADIGAN KARTA KO'TARILADI: hamma karta
      // hover'da qimirlasa, qaysi biri havola ekani bilinmasdi.
      interactive &&
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1 p-5 pb-3", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[0.9375rem] font-semibold tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";
