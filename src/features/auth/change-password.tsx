"use client";

/**
 * TAYYOR PAROLNI ALMASHTIRISH — MAJBURIY EKRAN.
 *
 * ── NIMA UCHUN TO'SIQ ─────────────────────────────────────────────────
 *
 * Tashkilotga parol QOG'OZDA beriladi ("app ijro" o'rniga tayyor
 * login-parol). Almashtirish majburiy bo'lmasa, yuzlab tashkilotning
 * paroli tizimda ABADIY qolardi — va ularning ro'yxati bir marta
 * tarqalsa, hammasi birdan ochilib ketardi.
 *
 * ⚠️ TO'SIQ SERVERDA HAM BOR (`JwtAuthGuard`): `GET /auth/me` va shu
 * endpoint'dan boshqa hamma so'rov 403 qaytaradi. Faqat panelda
 * to'sib qo'yilsa, nazorat KO'RINISH bo'lib qolardi — tayyor parol
 * bilan to'g'ridan-to'g'ri API ga so'rov yuborish mumkin edi.
 *
 * ⚠️ SHU SABABLI BU EKRAN ALOHIDA SAHIFA EMAS, QOBIQ ICHIDA
 * (`app-shell.tsx`): alohida yo'l bo'lsa, foydalanuvchi boshqa
 * sahifaga o'tib, hamma so'rov 403 bo'lgan BUZUQ ekranni ko'rardi
 * va sababini tushunmasdi.
 */

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { ApiError, api, tokens } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { FieldError, Input, Label } from "@/shared/ui/input";

/** ⚠️ Serverdagi `ChangePasswordDto` bilan AYNI chegara. */
const MIN_LENGTH = 8;

export const ChangePasswordGate = ({ username }: { username: string }) => {
  const queryClient = useQueryClient();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPending, setPending] = useState(false);

  const submit = async () => {
    setError(undefined);

    if (next.length < MIN_LENGTH) {
      setError(`Yangi parol kamida ${MIN_LENGTH} belgi bo'lishi kerak`);
      return;
    }

    /**
     * ⚠️ IKKI MARTA YOZISH MAJBURIY: parol ekranda ko'rinmaydi va
     * bitta xato harf bilan almashtirilgan parol foydalanuvchini
     * tizimdan BUTUNLAY chiqarib qo'yardi — tiklash uchun esa
     * admin kerak bo'lardi.
     */
    if (next !== repeat) {
      setError("Yangi parol ikki joyda bir xil bo'lishi kerak");
      return;
    }

    setPending(true);
    try {
      /**
       * ⚠️ JAVOBDA YANGI TOKENLAR KELADI: server parol
       * almashganda BARCHA sessiyalarni yopadi (o'zining ham) —
       * eski refresh token amalda qolsa, parolni bilgan odam
       * baribir kirib turardi. Yangi tokenlar saqlanmasa,
       * foydalanuvchi parolni almashtirib, darhol login
       * sahifasiga tushib ketardi.
       */
      const result = await api.post<{ accessToken: string; refreshToken: string }>(
        "/auth/change-password",
        { currentPassword: current, newPassword: next },
      );

      tokens.save(result.accessToken, result.refreshToken);

      toast.success("Parol almashtirildi");

      // ⚠️ `me` BEKOR QILINADI: `mustChangePassword` endi `false`
      // va qobiq shundan keyin oddiy panelni ko'rsatadi.
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Parol almashtirilmadi",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <KeyRound className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-medium">Parolni almashtirish</p>
            <p className="truncate text-xs text-muted-foreground">{username}</p>
          </div>
        </div>

        <p className="mb-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Sizga <strong>tayyor parol</strong> berilgan. Davom etish uchun uni o&apos;zingiz
          biladigan parolga almashtiring — shundan keyin panelning qolgan bo&apos;limlari
          ochiladi.
        </p>

        <div className="space-y-3">
          <div>
            <Label>Hozirgi parol</Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </div>

          <div>
            <Label>Yangi parol</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </div>

          <div>
            <Label>Yangi parolni qayta yozing</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
              }}
            />
          </div>

          <FieldError message={error} />

          <Button
            className="w-full"
            disabled={isPending || current.length === 0 || next.length === 0}
            onClick={() => void submit()}
          >
            Almashtirish
          </Button>
        </div>
      </Card>
    </div>
  );
};
