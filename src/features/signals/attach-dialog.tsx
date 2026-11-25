"use client";

/**
 * SIGNALNI MUROJAATGA AYLANTIRISH OYNASI.
 *
 * ⚠️ FAQAT KATEGORIYA MAJBURIY. Sarlavha va muhimlik — ixtiyoriy:
 * operator kuniga o'nlab signalni ko'radi va har biri uchun uchta
 * maydon to'ldirish oqimni to'xtatib qo'yardi. Sarlavha berilmasa,
 * server signal matnining birinchi gapidan yasaydi.
 *
 * ⚠️ XABAR MATNI OYNADA KO'RSATILADI: operator "qaysi signalni
 * biriktirayapman" degan savolga javob olishi kerak — ayniqsa
 * ro'yxatda bir nechta o'xshash signal bo'lganda.
 */

import { useEffect, useState } from "react";

import { useActiveCategories } from "@/features/issues/api";
import type { IssuePriority, Signal } from "@/shared/api/types";
import { ISSUE_PRIORITY } from "@/shared/config/labels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input, Label } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/states";

interface Props {
  signal: Signal | null;
  onClose: () => void;
  onSubmit: (input: {
    id: string;
    categoryId: string;
    title?: string;
    priority?: IssuePriority;
  }) => void;
  isSubmitting: boolean;
}

/** Signal jiddiyligidan murojaat muhimligiga taklif. */
const SUGGESTED_PRIORITY: Record<Signal["severity"], IssuePriority> = {
  low: "low",
  normal: "normal",
  // ⚠️ `high` → `high`, `urgent` EMAS: `urgent` — ODAM qarori.
  // AI'ning "yuqori" bahosini avtomatik "shoshilinch"ga
  // aylantirish o'sha yorliqni qadrsizlantirardi.
  high: "high",
};

export const AttachSignalDialog = ({
  signal,
  onClose,
  onSubmit,
  isSubmitting,
}: Props) => {
  const { data: categories, isLoading } = useActiveCategories();

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("normal");

  /**
   * ⚠️ OYNA OCHILGANDA FORMA TOZALANADI. Usiz oldingi signalning
   * kategoriyasi va sarlavhasi YANGISIDA qolib ketardi — va
   * operator buni sezmay, noto'g'ri kategoriya bilan biriktirardi.
   *
   * ⚠️ AI TAXMINI BU YERDA QO'YILMAYDI — pastdagi ALOHIDA effekt
   * qo'yadi. Sabab: taxminni tekshirish uchun yo'nalishlar
   * ro'yxati KERAK, u esa so'rov bilan keladi va oyna
   * ochilganda hali bo'lmasligi mumkin. Ikkisi bitta effektga
   * qo'shilsa, ro'yxat yangilanganda sarlavha va muhimlik ham
   * qayta tozalanib, operator yozganini YO'QOTARDI.
   */
  useEffect(() => {
    if (!signal) return;

    setCategoryId("");
    setTitle("");
    setPriority(SUGGESTED_PRIORITY[signal.severity]);
  }, [signal]);

  /**
   * AI TAXMINI OLDINDAN TANLANADI — lekin QAROR EMAS.
   *
   * Operator uni bir bosishda o'zgartiradi. "AI taklif, qaror
   * emas" doktrinasi (`mobile-ai.service.ts`) shu yerda ham amal
   * qiladi — farqi shunda, mobil taklifni FUQARO tasdiqlaydi, bu
   * yerda esa OPERATOR.
   *
   * ⚠️ TAXMIN FAOL RO'YXATDA BORLIGI TEKSHIRILADI. Signal
   * yozilgandan keyin yo'nalish o'chirilgan bo'lishi mumkin
   * (`isActive: false` — yumshoq o'chirish) va u holda Select
   * ro'yxatda YO'Q qiymatni ushlab turardi: maydon bo'sh
   * ko'rinardi, "Yaratish" tugmasi esa YONIB turardi — operator
   * bosib, o'chirilgan yo'nalishda murojaat yaratardi.
   *
   * ⚠️ FUNKSIONAL YANGILASH (`(current) => ...`): yuqoridagi
   * effekt bilan AYNI commit'da ishlaydi va `categoryId` ni
   * to'g'ridan-to'g'ri o'qish ESKI qiymatni berardi. Shart
   * (`current` bo'sh) operator allaqachon tanlagan yo'nalishni
   * taxmin bilan ALMASHTIRIB qo'yishdan ham saqlaydi.
   */
  useEffect(() => {
    const suggested = signal?.category?.id;
    if (!suggested || !categories) return;

    const exists = categories.some((category) => category.id === suggested);
    if (!exists) return;

    setCategoryId((current) => current || suggested);
  }, [signal, categories]);

  if (!signal) return null;

  const handleSubmit = () => {
    if (!categoryId) return;

    onSubmit({
      id: signal.id,
      categoryId,
      // ⚠️ BO'SH SARLAVHA `undefined` SIFATIDA ketadi, bo'sh satr
      // emas: server `undefined` bo'lsa o'zi yasaydi, bo'sh satr
      // esa validatsiyada yiqilardi.
      title: title.trim() || undefined,
      priority,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Murojaatga aylantirish</DialogTitle>
          <DialogDescription>
            Signal rasmiy murojaat navbatiga tushadi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Xabar matni — nimani biriktirayotganini ko'rsatish. */}
          <blockquote className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed">
            {signal.summary}
          </blockquote>

          <div className="space-y-1.5">
            <Label>
              Yo&apos;nalish <span className="text-destructive">*</span>
            </Label>

            {isLoading ? (
              <div className="flex h-9 items-center px-3">
                <Spinner className="text-muted-foreground" />
              </div>
            ) : (categories?.length ?? 0) === 0 ? (
              // ⚠️ KATEGORIYA YO'Q — NIMA QILISH KERAKLIGI
              // AYTILADI. Bo'sh ro'yxat ko'rsatilsa, operator
              // tizim buzilgan deb o'ylardi.
              <p className="text-sm text-destructive">
                Faol yo&apos;nalish yo&apos;q. Sozlamalarda qo&apos;shing.
              </p>
            ) : (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/*
              ⚠️ TO'LDIRILGAN MAYDON SABABINI AYTADI: tanlov
              o'zidan paydo bo'lgandek ko'rinsa, operator unga
              ishonib, TEKSHIRMASDAN o'tib ketardi. "AI tanladi"
              degan izoh esa uni bir ko'z tashlashga undaydi —
              bu AI taxmini, fakt emas.

              ⚠️ FAQAT TANLOV HALI O'ZGARTIRILMAGANDA ko'rinadi:
              operator boshqasini tanlagach, izoh YOLG'ON bo'lib
              qolardi.
            */}
            {signal.category && categoryId === signal.category.id ? (
              <p className="text-xs text-muted-foreground">
                Yo&apos;nalishni AI tanladi — tekshirib, kerak bo&apos;lsa
                o&apos;zgartiring.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attach-title">Sarlavha</Label>
            <Input
              id="attach-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              // ⚠️ PLACEHOLDER SERVER XULQINI AYTADI: operator
              // maydonni bo'sh qoldirsa nima bo'lishini bilishi
              // kerak.
              placeholder="Bo'sh qoldirilsa — xabarning birinchi gapidan"
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Muhimligi</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as IssuePriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ISSUE_PRIORITY).map(([value, def]) => (
                  <SelectItem key={value} value={value}>
                    {def.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={!categoryId || isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            Yaratish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
