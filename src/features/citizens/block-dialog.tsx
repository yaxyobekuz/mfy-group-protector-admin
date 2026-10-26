"use client";

/**
 * FUQARONI BLOKLASH / YECHISH OYNASI.
 *
 * ⚠️ BLOKLASHDA SABAB MAJBURIY: u fuqaroga ilovada ko'rsatiladi
 * (`mobile-auth.service.ts` / guard 403). Bo'sh qoldirilsa, odam "ilova
 * ishlamayapti" deb o'ylab yurardi. Blokni YECHISHDA sabab kerak emas.
 */

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Label, Textarea } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/states";

interface Props {
  name: string;
  currentlyBlocked: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export const BlockDialog = ({ name, currentlyBlocked, pending, onClose, onConfirm }: Props) => {
  const [reason, setReason] = useState("");

  // Hozir bloklangan bo'lsa — amal "yechish" (sabab kerak emas).
  const unblocking = currentlyBlocked;
  const canConfirm = unblocking || reason.trim().length >= 3;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {unblocking ? "Blokni yechish" : "Fuqaroni bloklash"}
          </DialogTitle>
          <DialogDescription>
            {unblocking
              ? `${name} yana murojaat yubora oladi.`
              : `${name} ilovadan murojaat yubora olmaydi. Sabab unga ko'rsatiladi.`}
          </DialogDescription>
        </DialogHeader>

        {!unblocking ? (
          <div className="space-y-1.5">
            <Label htmlFor="reason">Sabab (majburiy)</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Masalan: takroriy bema'ni murojaatlar"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Bekor qilish
          </Button>
          <Button
            variant={unblocking ? "default" : "destructive"}
            disabled={!canConfirm || pending}
            onClick={() => onConfirm(unblocking ? undefined : reason.trim())}
          >
            {pending ? <Spinner className="mr-1.5 size-4" /> : null}
            {unblocking ? "Blokni yechish" : "Bloklash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
