"use client";

/**
 * QIDIRUVLI TANLOV — uzun ro'yxatlar uchun.
 *
 * ⚠️ NIMA UCHUN KERAK: viloyatda YUZLAB MFY bor va oddiy `Select`
 * ularni bitta uzun ro'yxat qilib beradi. Operator kerakli MFY ni
 * topish uchun o'nlab marta aylantirishi kerak bo'lardi — ya'ni
 * guruhni biriktirish amalda ishlatib bo'lmaydigan ish edi.
 *
 * ⚠️ RADIX `Select` USTIGA QURILMAGAN va bu ataylab: Radix o'z
 * "typeahead" mexanizmiga ega — bosilgan harf ro'yxatda sakrash
 * uchun ishlatiladi va qidiruv maydoniga YETIB BORMAYDI. Ustiga
 * input qo'yilsa, har harfda fokus ro'yxatga o'g'irlanardi.
 *
 * ⚠️ `cmdk` KABI YANGI PAKET QO'SHILMADI: butun xatti-harakat
 * 150 qatorga sig'adi va yangi bog'liqlik butun panelning
 * build hajmiga qo'shilardi.
 *
 * ⚠️ `z-[1200]` — `select.tsx` BILAN AYNI: Leaflet boshqaruvlari
 * `z-index: 1000` oladi va pastroq qiymat xarita sahifasida
 * ro'yxatni ko'rinmas qilardi.
 */

import { Check, ChevronDown, Search } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/cn";

export interface SearchableOption {
  value: string;
  label: string;
  /** Ikkinchi qator — masalan MFY uchun tuman nomi. */
  hint?: string;
}

interface SearchableSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: SearchableOption[];
  placeholder?: string;
  /** "Tanlovni bekor qilish" qatori. `null` bo'lsa — qator yo'q. */
  clearLabel?: string | null;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Qidiruv uchun matnni soddalashtiradi.
 *
 * ⚠️ APOSTROF TURLARI TENGLASHTIRILADI: MFY nomlarida `o'`, `g'`
 * bor va ular bazaga turlicha kiritilgan bo'lishi mumkin (`'`,
 * `'`, `‘`). Tenglashtirilmasa, "Qo'yliq" deb yozgan odam
 * "Qo‘yliq" ni TOPMASDI va MFY yo'qdek ko'rinardi.
 */
const normalize = (text: string): string =>
  text
    .toLocaleLowerCase("uz")
    .replace(/[‘’ʻʼ`']/g, "'")
    .trim();

export const SearchableSelect = ({
  value,
  onValueChange,
  options,
  placeholder = "Tanlang",
  clearLabel = null,
  searchPlaceholder = "Qidirish...",
  emptyLabel = "Topilmadi",
  disabled,
  className,
}: SearchableSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = React.useMemo(() => {
    const needle = normalize(query);
    if (!needle) return options;

    return options.filter(
      (option) =>
        normalize(option.label).includes(needle) ||
        (option.hint ? normalize(option.hint).includes(needle) : false),
    );
  }, [options, query]);

  // ⚠️ TASHQARIGA BOSILGANDA YOPILADI: usiz ro'yxat ochiq qolib,
  // jadvaldagi keyingi qatorni bosib bo'lmasdi.
  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // ⚠️ OCHILGANDA FOKUS QIDIRUVGA: butun komponentning ma'nosi
  // shu — ochib, darhol yozib ketish.
  React.useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  const choose = (next: string | null) => {
    onValueChange(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
        )}
      >
        {/*
          ⚠️ TANLANGANDA IZOH HAM KO'RSATILADI va bu TUZATILGAN XATO:
          avval tugmada faqat `label` turardi. Viloyatda BIR XIL
          NOMLI MFY lar bor (har tumanda "Turon", "Birlik") va
          Telegram guruhlari ro'yxatida ular bir-biridan farq
          qilmasdi — operator qaysi tumanning MFY sini biriktirganini
          BILMASDI. Izoh ro'yxatda ko'rinib, tanlangandan keyin
          YO'QOLARDI.

          ⚠️ `truncate` IKKALASIDA HAM: tor ustunda uzun tuman nomi
          tugmani cho'zib, jadval ustunlarini surib yuborardi.
        */}
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            <>
              <span>{selected.label}</span>
              {selected.hint ? (
                <span className="text-muted-foreground"> · {selected.hint}</span>
              ) : null}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-[1200] mt-1 w-full min-w-[14rem] overflow-hidden rounded-md border bg-card text-card-foreground shadow-md">
          <div className="flex items-center gap-2 border-b px-2.5">
            <Search className="size-3.5 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
                // ⚠️ ENTER — BIRINCHI NATIJANI TANLAYDI: operator
                // yozib, qo'lini sichqonchaga olmasdan davom
                // etadi. Aynan shu tezlik uchun qidiruv qo'yildi.
                if (event.key === "Enter") {
                  const first = filtered[0];
                  if (!first) return;
                  event.preventDefault();
                  choose(first.value);
                }
              }}
              placeholder={searchPlaceholder}
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* ⚠️ BALANDLIK CHEKLANGAN: 400 ta MFY ekrandan chiqib
              ketib, pastki qatorlarga yetib bo'lmasdi. */}
          <div className="max-h-64 overflow-y-auto p-1">
            {clearLabel !== null && !query ? (
              <Row
                label={clearLabel}
                selected={value === null}
                onSelect={() => choose(null)}
              />
            ) : null}

            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                {emptyLabel}
              </p>
            ) : (
              filtered.map((option) => (
                <Row
                  key={option.value}
                  label={option.label}
                  hint={option.hint}
                  selected={option.value === value}
                  onSelect={() => choose(option.value)}
                />
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Row = ({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
      "hover:bg-accent hover:text-accent-foreground",
      selected && "bg-accent/60",
    )}
  >
    <span className="min-w-0">
      <span className="block truncate">{label}</span>
      {hint ? (
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </span>
    {selected ? <Check className="size-4 shrink-0" /> : null}
  </button>
);
