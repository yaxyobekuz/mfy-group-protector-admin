"use client";

/**
 * FUQAROLARGA XABAR YUBORISH OYNASI.
 *
 * ⚠️ YANGILIK E'LONIDAN FARQI: bu xabar Telegram'da PUSH sifatida
 * darhol yetib boradi (fuqaroning shaxsiy chatiga). Shuning uchun u
 * kuchliroq amal — tasdiq bilan yuboriladi.
 *
 * ⚠️ TUMAN IXTIYORIY: bo'sh — BARCHA fuqarolarga. Bloklanganlarga
 * yuborilmaydi (server hal qiladi).
 */

import { useState } from "react";

import { useBroadcast } from "@/features/citizens/api";
import { useDistricts } from "@/features/territory/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/states";

const ALL = "__all__";

interface Props {
  onClose: () => void;
}

export const BroadcastDialog = ({ onClose }: Props) => {
  const broadcast = useBroadcast();
  const districts = useDistricts();

  const [message, setMessage] = useState("");
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const canSend = message.trim().length >= 3;
  const scopeLabel = districtId
    ? districts.data?.find((d) => d.id === districtId)?.name ?? "tanlangan tuman"
    : "BARCHA fuqarolar";

  const handleSend = () => {
    broadcast.mutate(
      { message: message.trim(), districtId: districtId ?? undefined },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fuqarolarga xabar</DialogTitle>
          <DialogDescription>
            Xabar fuqarolarning Telegram chatiga yetib boradi. Bloklanganlarga
            yuborilmaydi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Qabul qiluvchilar</Label>
            <Select
              value={districtId ?? ALL}
              onValueChange={(value) => setDistrictId(value === ALL ? null : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha fuqarolar</SelectItem>
                {districts.data?.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name} fuqarolari
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg">Xabar matni</Label>
            <Textarea
              id="msg"
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Masalan: Hurmatli fuqarolar, ertaga hashar o'tkaziladi..."
            />
          </div>

          {/* ⚠️ IKKI BOSQICHLI TASDIQ: keng qamrovli amal bir bosishda
              yuborilmasligi kerak. */}
          {confirm ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <strong>{scopeLabel}</strong>ga yuboriladi. Davom etasizmi?
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={broadcast.isPending}>
            Bekor qilish
          </Button>
          {confirm ? (
            <Button disabled={!canSend || broadcast.isPending} onClick={handleSend}>
              {broadcast.isPending ? <Spinner className="mr-1.5 size-4" /> : null}
              Ha, yuborish
            </Button>
          ) : (
            <Button disabled={!canSend} onClick={() => setConfirm(true)}>
              Yuborish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
