"use client";

/**
 * HISOBOT YORDAMCHISI — KO'RSATKICH BO'YICHA SAVOL.
 *
 * ── NIMA UCHUN KERAK ──────────────────────────────────────────────────
 *
 * ⚠️ HISOBOT RAQAM BERADI, XULOSA BERMAYDI: panelda "Asaka — 450,
 * Ulug'nor — 50" degan diagramma turadi, lekin "nima qilish kerak"
 * degan savolga javob yo'q. Rahbariyat uchun aynan o'sha javob
 * kerak.
 *
 * ── MODEL RAQAM O'YLAB TOPMAYDI ───────────────────────────────────────
 *
 * ⚠️ RAQAMLARNI SERVER YIG'ADI (`reports-ai.service.ts`): modelga
 * baza ochilmaydi va u SQL yozmaydi. Javob bilan birga ASL
 * RAQAMLAR ham qaytadi — xodim ularni solishtirib ko'rishi mumkin.
 *
 * ⚠️ JAVOB SAQLANMAYDI: u ekranda, savol bergan odamga, bir marta
 * ko'rsatiladi. "AI matn yozmaydi" doktrinasi BUZILMAYDI — u
 * `GroupSignal.summary` haqida, ya'ni AI yozgan xulosa RASMIY
 * navbatga tusha olmasligi haqida edi.
 *
 * ⚠️ QAROR XODIMDA QOLADI: yordamchi tugma bosmaydi, holat
 * o'zgartirmaydi, murojaat yaratmaydi. U faqat GAPIRADI.
 */

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { useReportAssistant, type ReportFilters } from "@/features/reports/api";
import { ApiError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FieldError, Label, Textarea } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/states";

/**
 * TAYYOR SAVOLLAR.
 *
 * ⚠️ BO'SH MAYDON ENG YOMON BOSHLANISH: xodim "nima so'rasam
 * bo'ladi" degan savolda qotib qoladi va oynani yopib ketadi.
 * Tayyor savollar yordamchining NIMAGA yaroqli ekanini ham
 * ko'rsatadi.
 *
 * ⚠️ UCHTA, O'NTA EMAS: ro'yxat uzun bo'lsa, u o'zi menyuga
 * aylanib, erkin savol yozish imkoni ko'rinmay ketardi.
 */
const SUGGESTIONS = [
  "Qaysi tumanda holat eng yomon va nima qilish kerak?",
  "Muddati o'tgan murojaatlar qaysi yo'nalishda ko'p? Sababi nima bo'lishi mumkin?",
  "Qaysi MFY da tizimli muammo bor — yamoq emas, almashtirish kerak?",
];

/** Savol uzunligi chegarasi — server ham shu songa cheklaydi. */
const MAX_LENGTH = 500;

export const ReportAssistant = ({ filters }: { filters: ReportFilters }) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");

  const assistant = useReportAssistant();

  const ask = () => {
    const text = question.trim();
    if (text.length < 3) return;

    assistant.mutate({ question: text, filters });
  };

  /**
   * ⚠️ OYNA YOPILGANDA HOLAT TOZALANADI: eski javob qolsa, xodim
   * ertasi kuni oynani ochib, BOSHQA davrga tegishli xulosani
   * ko'rardi — va u ishonchli ko'rinardi.
   */
  const close = () => {
    setOpen(false);
    setQuestion("");
    assistant.reset();
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="mr-1.5 size-4" />
        Yordamchi
      </Button>

      {open ? (
        <Dialog open onOpenChange={(next) => !next && close()}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Hisobot yordamchisi</DialogTitle>
              {/*
                ⚠️ CHEGARA OLDINDAN AYTILADI: xodim "o'tgan yili
                nima bo'ldi" deb so'rab, ekrandagi davr bo'yicha
                javob olardi — va buni sezmasdi, chunki javob
                ishonchli matn bo'lib chiqadi.
              */}
              <DialogDescription>
                Javob EKRANDAGI filtr bo&apos;yicha yig&apos;ilgan raqamlardan
                chiqadi. Yordamchi tavsiya beradi, qaror sizda qoladi.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="question">Savol</Label>
                <Textarea
                  id="question"
                  rows={3}
                  maxLength={MAX_LENGTH}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Masalan: qaysi yo'nalishda muddat ko'p buzilyapti?"
                />
              </div>

              {/*
                ⚠️ TAYYOR SAVOL BOSILGANDA DARHOL YUBORILMAYDI:
                matn maydonga tushadi va xodim uni TAHRIRLASHI
                mumkin ("...Asaka tumanida" deb qo'shishi).
              */}
              {!assistant.data ? (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuestion(item)}
                      className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}

              {assistant.isError ? (
                <FieldError
                  message={
                    assistant.error instanceof ApiError
                      ? assistant.error.message
                      : "Yordamchi javob bera olmadi"
                  }
                />
              ) : null}

              {assistant.data ? (
                <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                  {/*
                    ⚠️ `whitespace-pre-line`: model javobni
                    paragraflarga bo'lib beradi va ularsiz
                    hammasi bitta uzun g'ishtga aylanardi.
                  */}
                  <p className="whitespace-pre-line text-sm">
                    {assistant.data.answer}
                  </p>

                  {/*
                    ⚠️ ASL RAQAMLAR OCHILADIGAN BO'LIMDA: javobni
                    TEKSHIRISH imkoni bo'lishi kerak ("model
                    buni qayerdan oldi"). Ochiq tursa, u javobni
                    ko'mib yuborardi.
                  */}
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none">
                      Javob qaysi raqamlardan chiqdi
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[11px]">
                      {JSON.stringify(assistant.data.context, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={assistant.isPending}>
                Yopish
              </Button>
              <Button
                onClick={ask}
                disabled={question.trim().length < 3 || assistant.isPending}
              >
                {assistant.isPending ? <Spinner className="mr-1.5 size-4" /> : null}
                {assistant.data ? "Qaytadan so'rash" : "So'rash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
};
