"use client";

/**
 * OMMAVIY AMALLAR — kuzatuv va qalqonni BIR VAQTDA ko'p guruhga.
 *
 * ⚠️ NIMA UCHUN KERAK: guruhlar o'nlab va ularni bitta-bitta yoqish
 * har guruhga bitta so'rov va bitta audit yozuvi demakdi — ya'ni
 * jurnal 40 qator bir xil yozuv bilan to'lardi va o'qib
 * bo'lmasdi (`audit.service.ts`: "hamma narsani yozish").
 * Ommaviy amal bitta so'rov yuboradi va auditga BITTA yozuv
 * qoldiradi.
 *
 * ⚠️ QAMROV — EKRANDAGI FILTR, ko'rinib turgan sahifa EMAS. Ro'yxat
 * sahifalangan va operator "hammasi" deganda butun filtr natijasini
 * tushunadi. Shuning uchun serverga id ro'yxati emas, FILTRNING
 * O'ZI yuboriladi va u serverda qamrov sharti bilan qayta hal
 * qilinadi.
 *
 * ⚠️ TASDIQLASH MAJBURIY va oynada ANIQ RAQAM turadi. Ikkala amal
 * ham qaytarib bo'lmaydigan oqibatga ega:
 *   kuzatuv  → tizim guruh yozishmasini O'QIY boshlaydi;
 *   qalqon   → bot aholining xabarini O'CHIRA boshlaydi.
 * O'sha raqam serverga ham yuboriladi (`expectedCount`): tasdiq
 * bilan amal orasida ro'yxat o'zgargan bo'lsa, server rad etadi.
 */

import { Radio, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { useSession } from "@/entities/session/auth-provider";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useBulkSetGuard } from "@/features/security/api";
import {
  toBulkFilter,
  useBulkSetOfficial,
  type GroupFilters,
} from "./api";

/** Qaysi amal tasdiqlanmoqda. */
type PendingAction =
  | { kind: "official"; enable: boolean }
  | { kind: "guard"; enable: boolean };

interface BulkActionsProps {
  filters: GroupFilters;
  /** Filtrdan o'tgan JAMI guruh (sahifadagi emas). */
  total: number;
}

export const GroupBulkActions = ({ filters, total }: BulkActionsProps) => {
  const { can } = useSession();

  const bulkOfficial = useBulkSetOfficial();
  const bulkGuard = useBulkSetGuard();

  const [pending, setPending] = useState<PendingAction | null>(null);

  const canOfficial = can("groups.official");
  const canGuard = can("security.guard");

  // ⚠️ IKKALA RUXSAT HAM YO'Q BO'LSA — PANEL UMUMAN KO'RINMAYDI:
  // bosib bo'lmaydigan tugmalar qatori operatorni chalg'itardi.
  if (!canOfficial && !canGuard) return null;

  // ⚠️ RO'YXAT BO'SH BO'LSA YASHIRILADI: "0 ta guruhga yoqish"
  // ma'nosiz va tasdiqlash oynasi ham bo'sh chiqardi.
  if (total === 0) return null;

  const isPending = bulkOfficial.isPending || bulkGuard.isPending;

  const confirm = () => {
    if (!pending) return;

    const filter = toBulkFilter(filters, total);

    if (pending.kind === "official") {
      bulkOfficial.mutate(
        { ...filter, isOfficial: pending.enable },
        { onSettled: () => setPending(null) },
      );
    } else {
      bulkGuard.mutate(
        { ...filter, guardEnabled: pending.enable },
        { onSettled: () => setPending(null) },
      );
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
        <p className="mr-auto text-sm text-muted-foreground">
          Filtrdagi{" "}
          <span className="font-medium text-foreground">{total} ta guruh</span>{" "}
          uchun ommaviy amal
        </p>

        {canOfficial ? (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setPending({ kind: "official", enable: true })}
            >
              <Radio className="size-4" />
              Kuzatuvni yoqish
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setPending({ kind: "official", enable: false })}
            >
              Kuzatuvni o&apos;chirish
            </Button>
          </>
        ) : null}

        {canGuard ? (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setPending({ kind: "guard", enable: true })}
            >
              <ShieldCheck className="size-4" />
              Qalqonni yoqish
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setPending({ kind: "guard", enable: false })}
            >
              Qalqonni o&apos;chirish
            </Button>
          </>
        ) : null}
      </div>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setPending(null);
        }}
      >
        <DialogContent>
          {pending ? (
            <>
              <DialogHeader>
                <DialogTitle>{titleOf(pending, total)}</DialogTitle>
                {/*
                  ⚠️ OQIBAT AYTILADI, "tasdiqlaysizmi?" EMAS:
                  operator nima o'zgarishini bilishi kerak —
                  ikkala amal ham guruh ichidagi odamlarga
                  bevosita ta'sir qiladi.
                */}
                <DialogDescription>{descriptionOf(pending)}</DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setPending(null)}
                >
                  Bekor qilish
                </Button>
                <Button
                  variant={pending.enable ? "default" : "destructive"}
                  disabled={isPending}
                  onClick={confirm}
                >
                  {isPending ? "Bajarilmoqda..." : "Tasdiqlash"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

const titleOf = (action: PendingAction, total: number): string => {
  const subject = action.kind === "official" ? "Kuzatuv" : "Qalqon";
  const verb = action.enable ? "yoqilsinmi" : "o'chirilsinmi";
  return `${total} ta guruhda ${subject.toLowerCase()} ${verb}?`;
};

const descriptionOf = (action: PendingAction): string => {
  if (action.kind === "official") {
    return action.enable
      ? // ⚠️ MFYSIZ GURUHLAR HAQIDA OLDINDAN AYTILADI: server
        // ularni o'tkazib yuboradi va natija xabarida ham
        // ko'rsatiladi, lekin odam buni TASDIQLASHDAN OLDIN
        // bilgani ma'qul.
        "Tizim bu guruhlardagi xabarlarni o'qiy boshlaydi. MFY biriktirilmagan guruhlar o'tkazib yuboriladi — ularni avval biriktirish kerak."
      : "Kuzatuv to'xtaydi va bu guruhlarning tahlil qilinmagan xabarlari o'chiriladi. Qayta yoqilsa, eski xabarlar ko'rilmaydi.";
  }

  return action.enable
    ? "Bot bu guruhlarda zararli fayl va havolali xabarlarni o'chira boshlaydi. Guruhga hech narsa yozilmaydi — o'chirilgani faqat panelda ko'rinadi."
    : "Bot bu guruhlarda endi hech narsani o'chirmaydi. Oldin yozilgan xavfsizlik hodisalari jurnalda qoladi.";
};
