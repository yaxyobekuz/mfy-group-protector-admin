/**
 * HOLAT KO'RINISHLARI — yuklanish, bo'sh, xato.
 *
 * ⚠️ UCHTA HOLAT ATAYLAB AJRATILGAN va ularni aralashtirmaslik
 * kerak:
 *
 *   yuklanish  →  skelet (joy egallaydi, "sakrash" bo'lmaydi)
 *   bo'sh      →  NIMA QILISH KERAKLIGI aytiladi
 *   xato       →  SABAB + qayta urinish tugmasi
 *
 * Eng ko'p uchraydigan xato — bo'sh ro'yxatni "ma'lumot yo'q" deb
 * ko'rsatish. Foydalanuvchi o'shanda tizim buzilganmi yoki
 * haqiqatan hech narsa yo'qmi — bilmaydi.
 */

import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "./button";
import { cn } from "@/shared/lib/cn";

/** Jadval uchun skelet qatorlar. */
export const TableSkeleton = ({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) => (
  <div className="divide-y">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div
            key={colIndex}
            className={cn(
              "h-4 animate-pulse rounded bg-muted",
              // ⚠️ KENGLIKLAR XILMA-XIL: bir xil bo'lsa skelet
              // jadvalga emas, chiziqlarga o'xshab ko'rinardi.
              colIndex === 0 ? "w-1/3" : "flex-1",
            )}
          />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-lg border p-4">
        <div className="mb-3 h-4 w-1/4 animate-pulse rounded bg-muted" />
        <div className="mb-2 h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
);

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn("size-4 animate-spin", className)} />
);

/**
 * BO'SH HOLAT.
 *
 * ⚠️ `hint` TAVSIYA ETILADI: "Hech narsa topilmadi" degan yorliq
 * o'zicha hech narsa bermaydi. Foydalanuvchi NIMA QILISHI
 * kerakligini bilishi kerak ("Botni guruhga qo'shing", "Filtrni
 * tozalang").
 */
export const EmptyState = ({
  title,
  hint,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  hint?: string;
  icon?: typeof Inbox;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    <div className="rounded-full bg-muted p-3">
      <Icon className="size-6 text-muted-foreground" />
    </div>
    <div className="space-y-1">
      <p className="font-medium">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted-foreground">{hint}</p> : null}
    </div>
    {action}
  </div>
);

/**
 * XATO HOLATI.
 *
 * ⚠️ SERVER MATNI KO'RSATILADI: u o'zbek tilida va foydalanuvchiga
 * mo'ljallangan ("Bu oxirgi faol kategoriya..."). Uni "Xatolik yuz
 * berdi" bilan almashtirish foydalanuvchini sababsiz qoldirardi.
 *
 * ⚠️ QAYTA URINISH TUGMASI BOR: tarmoq uzilishi eng ko'p uchraydigan
 * sabab va sahifani butunlay yangilash o'rniga bitta so'rovni
 * qaytarish yetarli.
 */
export const ErrorState = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    <div className="rounded-full bg-destructive/10 p-3">
      <AlertCircle className="size-6 text-destructive" />
    </div>
    <div className="space-y-1">
      <p className="font-medium">Ma&apos;lumot yuklanmadi</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {message ?? "Server bilan aloqa yo‘q."}
      </p>
    </div>
    {onRetry ? (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Qayta urinish
      </Button>
    ) : null}
  </div>
);
