"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/shared/lib/cn";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      /**
       * ⚠️ RO'YXAT FONI — OQ (`bg-card`), `bg-muted` EMAS.
       *
       * Avval ro'yxat ham, uning ichidagi faol tugma ham OCHIQ
       * kulrang edi (`bg-muted` ustida `bg-background`) va ikki
       * fon bir-biridan deyarli ajralmasdi — faol tugmani faqat
       * yumshoq soyadan taxmin qilish mumkin edi. Tunda esa soya
       * UMUMAN ko'rinmaydi (`globals.css` dagi doktrina), ya'ni
       * qaysi tab ochiqligi butunlay bilinmasdi.
       *
       * ⚠️ CHEGARA MAJBURIY: oq ro'yxat oq KARTA ustida turishi
       * mumkin (Sozlamalar sahifasi) va chegarasiz u fonga singib
       * ketardi — tugmalar havoda osilgandek ko'rinardi.
       */
      "inline-flex h-9 items-center justify-center rounded-lg border bg-card p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      /**
       * ⚠️ FAOL TAB — BREND RANGI, kulrang emas.
       *
       * Rang bu yerda BEZAK EMAS: tablist "qaysi ro'yxatni
       * ko'ryapman" degan savolga javob beradi va eski ochiq
       * kulrang fon (`bg-background`) oq ro'yxatdan deyarli
       * farq qilmasdi — xodim MFY jadvalini ko'rib turib,
       * "Tumanlar" tabini bosganini o'ylab qolishi mumkin edi.
       *
       * ⚠️ MATN `text-primary-foreground`, QO'LDA `text-white`
       * EMAS. Kunduzi u baribir oq (`98%` yorug'lik), tunda esa
       * brend rangi YORQIN yashilga aylanadi (`globals.css`:
       * "to'q fonda quyuq yashil o'qilmasdi") va o'sha yorqin
       * yashil ustidagi oq matnning kontrasti WCAG dan O'TMASDI.
       * Token ikki mavzuda ham o'qiladigan rangni beradi —
       * ya'ni bu o'zgarishning MAQSADI (o'qish osonligi)
       * tunda teskarisiga aylanib ketmaydi.
       *
       * ⚠️ SOYA OLIB TASHLANDI: ajratuvchi endi RANG va soya
       * faqat tunda ko'rinmaydigan ikkinchi darajali belgi edi.
       */
      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";
