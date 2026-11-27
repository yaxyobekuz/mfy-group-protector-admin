"use client";

/**
 * TARQATMA — PANELDAN XABAR YUBORISH.
 *
 * ⚠️ IKKI USTUN, BITTA SAHIFA: chapda YIG'UVCHI, o'ngda TARIX.
 * Ikki sahifaga bo'linsa, operator yuborgandan keyin natijani
 * ko'rish uchun boshqa sahifaga o'tishi kerak bo'lardi — va
 * aynan o'sha paytda tarqatma ketayotgan bo'ladi.
 *
 * ⚠️ GURUH VA KANAL AUDITORIYASI ATAYLAB TANLANADI (doktrina):
 * guruhga yuborilgan xabarni o'chirib bo'lmaydi va u yuzlab
 * odamning ko'z o'ngida turadi. Shuning uchun yuborishdan oldin
 * auditoriya hajmi ko'rsatiladi va tugma IKKI BOSQICHLI.
 *
 * ⚠️ UZATILGAN XABAR (`forward`/`copy`) FAQAT BOTDAN: Telegram
 * `(from_chat_id, message_id)` juftligini talab qiladi va u
 * adminning SHAXSIY chati — paneldan uni olish yo'li yo'q.
 * Panelda bu haqda ochiq yoziladi, aks holda xodim "nega surat
 * yubora olmayapman" deb izlab yurardi.
 */

import { Bot } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import { BroadcastComposer } from "@/features/broadcasts/composer";
import { BroadcastHistory } from "@/features/broadcasts/history";
import { EmptyState } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";

export default function BroadcastsPage() {
  const { can } = useSession();

  if (!can("broadcast.send")) {
    return (
      <EmptyState
        title="Sizda bu bo'limga ruxsat yo'q"
        hint="Tarqatma yuborish uchun «broadcast.send» ruxsati kerak."
      />
    );
  }

  return (
    <>
      <PageHeader title="Tarqatma" />

      {/*
        ⚠️ YIG'UVCHI KENGROQ (3/5): unda o'nlab maydon bor, tarix
        esa qatorlardan iborat va tor ustunda ham o'qiladi.
      */}
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <BroadcastComposer />

          {/*
            ⚠️ BOT HAQIDAGI IZOH YIG'UVCHI OSTIDA: operator aynan
            shu yerda "surat yubora olmayapman" degan savolga
            duch keladi.
          */}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-secondary/60 px-3.5 py-3 text-xs text-muted-foreground">
            <Bot className="mt-0.5 size-4 shrink-0" />
            <p>
              Surat, video yoki tayyor xabarni <b>bot orqali</b> yuboring:
              botga <code className="text-[11px]">/admin</code> yozing va xabarni
              unga tashlang. Telegram uzatish uchun xabarning asl manzilini
              talab qiladi va u faqat shaxsiy chatda bo&apos;ladi.
            </p>
          </div>
        </div>

        <div className="xl:col-span-2">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Tarix</h2>
          <BroadcastHistory />
        </div>
      </div>
    </>
  );
}
