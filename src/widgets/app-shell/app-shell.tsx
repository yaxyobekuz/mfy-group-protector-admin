"use client";

/**
 * PANEL QOBIG'I — sidebar, header va kirish nazorati.
 *
 * ⚠️ KIRISH NAZORATI SHU YERDA, `middleware.ts` DA EMAS. Sabab:
 * token `localStorage` da yashaydi va Next middleware uni KO'RA
 * OLMAYDI (u server tomonida ishlaydi va faqat cookie'ni o'qiydi).
 * Cookie'ga o'tish ham mumkin edi, lekin `client.ts` dagi izohda
 * yozilgan sabablarga ko'ra `localStorage` tanlangan.
 *
 * Bu "himoya" emas, QULAYLIK: haqiqiy himoya serverda. Panelda
 * tokensiz odam bir lahza bo'sh ekran ko'rib, login sahifasiga
 * o'tadi — ma'lumot esa unga baribir berilmaydi.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LogOut, Menu, Moon, ShieldCheck, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useSession } from "@/entities/session/auth-provider";
import { api, tokens } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/query-keys";
import type { IssueStats, SignalCounts } from "@/shared/api/types";
import { NAV_ITEMS } from "@/shared/config/nav";
import { SCOPE_KIND, USER_ROLE } from "@/shared/config/labels";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/states";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, can, logout } = useSession();
  const [isMobileOpen, setMobileOpen] = useState(false);

  /**
   * ⚠️ TOKEN YO'QLIGI DARHOL TEKSHIRILADI, `user` ni kutmasdan:
   * `useSession` so'rov yuborganda `isLoading` bo'lib turadi va
   * tokensiz odam o'sha paytda spinner ko'rib qolardi — aslida
   * uni darhol login sahifasiga yuborish kerak.
   */
  useEffect(() => {
    if (!tokens.access()) router.replace("/login");
  }, [router]);

  /**
   * MENYUDAGI RAQAMLAR.
   *
   * ⚠️ RUXSAT BO'LMASA SO'ROV YUBORILMAYDI (`enabled`): aks holda
   * `viewer` roli menyuda ko'rinmaydigan bo'lim uchun 403 olib,
   * konsolni to'ldirardi.
   */
  const { data: signalCounts } = useQuery({
    queryKey: queryKeys.signals.counts(),
    queryFn: () => api.get<SignalCounts>("/signals/counts"),
    enabled: Boolean(user) && can("signals.view"),
    // ⚠️ 60 SEKUND: bu sarlavhadagi raqam, ro'yxat emas — har 30
    // sekundda yangilash keraksiz so'rov bo'lardi.
    staleTime: 60_000,
  });

  const { data: issueStats } = useQuery({
    queryKey: queryKeys.issues.stats(),
    queryFn: () => api.get<IssueStats>("/issues/stats"),
    enabled: Boolean(user) && can("issues.view"),
    staleTime: 60_000,
  });

  // ── Yuklanish / kirish ────────────────────────────────────────
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  const badges = {
    signals: signalCounts?.new ?? 0,
    issues: issueStats?.open ?? 0,
  };

  // ⚠️ MENYU RUXSAT BO'YICHA FILTRLANADI — bu KO'RINISH uchun
  // (`nav.ts` izohi). Server baribir tekshiradi.
  const items = NAV_ITEMS.filter(
    (item) => !item.permission || can(item.permission),
  );

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      {/*
        BREND.

        ⚠️ MAVZU ALMASHTIRGICHI SHU YERDA: yuqoridagi header olib
        tashlangan va u boshqa hech qayerda yo'q edi — sidebar'ga
        ko'chirilmasa tungi rejimni yoqish imkoni butunlay
        yo'qolardi.
      */}
      <div className="mb-6 flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Belgi — rasm emas, shakl: yuklanishni kutmaydi. */}
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">Viloyat shtabi</p>
            <p className="truncate text-xs text-muted-foreground">
              MFY muammolari
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <p className="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Menyu
      </p>

      {items.map((item) => {
        // ⚠️ `startsWith` ILDIZ UCHUN ISHLATILMAYDI: `/` hamma
        // yo'lga mos kelib, barcha bandlar faol bo'lib ko'rinardi.
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        const count = item.badge ? badges[item.badge] : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            // ⚠️ `aria-current`: ko'rish qobiliyati cheklangan
            // foydalanuvchiga faol bandni RANG emas, dastur aytadi.
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-primary font-semibold text-primary-foreground shadow-card"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon className="size-[1.125rem] shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {/* ⚠️ NOL KO'RSATILMAYDI: "0" yorlig'i e'tiborni
                tortadi, lekin hech narsa bildirmaydi. */}
            {count > 0 ? (
              <Badge
                className={cn(
                  "tabular rounded-full px-2",
                  // ⚠️ FAOL BANDDA KONTRAST TESKARI: yashil fonda
                  // yashil yorliq o'qilmasdi.
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                {count}
              </Badge>
            ) : null}
          </Link>
        );
      })}

      {/*
        PROFIL — pastda, alohida kartada.

        ⚠️ KARTA ICHIDA: sidebar oxiridagi oddiy matn "menyu bandi"
        bo'lib ko'rinib, bosiladigandek tuyulardi.
      */}
      <div className="mt-auto space-y-2 pt-4">
        <div className="rounded-xl bg-secondary/70 p-3">
          <div className="flex items-center gap-2.5">
            {/* Bosh harf — avatar rasmi yo'q. */}
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold uppercase text-primary">
              {user.username.slice(0, 1)}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{user.username}</p>
              <p className="truncate text-xs text-muted-foreground">
                {USER_ROLE[user.role]} · {SCOPE_KIND[user.scopeKind]}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-3 text-muted-foreground hover:text-destructive"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" />
          Chiqish
        </Button>
      </div>
    </nav>
  );

  return (
    /**
     * ⚠️ `h-screen` + `overflow-hidden`: sidebar QIMIRLAMAYDI,
     * faqat asosiy maydon aylanadi. Butun sahifa birga aylanganda
     * uzun jadvalda menyu ekrandan chiqib ketardi va operator
     * boshqa bo'limga o'tish uchun har safar tepaga qaytarardi.
     */
    <div className="flex h-screen gap-0 overflow-hidden p-0 lg:gap-4 lg:p-4">
      {/*
        Doimiy sidebar — katta ekranda.

        ⚠️ "SUZUVCHI": fonga yopishgan emas, o'z kartasi bor
        (`rounded-2xl` + soya). Chegara bilan u ekranni ikkiga
        kesib tashlardi.
      */}
      <aside className="hidden w-[16.5rem] shrink-0 rounded-2xl bg-card shadow-card dark:border dark:border-border lg:block">
        {sidebar}
      </aside>

      {/*
        Mobil sidebar.

        ⚠️ `Dialog` ISHLATILMAYDI, oddiy overlay: Radix Dialog
        fokusni qulflaydi (`focus trap`) va sidebar'dagi havolaga
        bosilganda sahifa o'zgarsa-da, fokus modalda qolib,
        klaviatura bilan navigatsiya buzilardi.
      */}
      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Menyuni yopish"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[17rem] bg-card shadow-lift dark:border-r dark:border-border">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/*
          MENYU TUGMASI — FAQAT MOBILDA.

          ⚠️ HEADER OLIB TASHLANGAN, lekin bu tugma QOLDI: u kichik
          ekranda sidebar'ni ochadigan YAGONA yo'l edi va u bilan
          birga o'chirilsa, telefonda navigatsiya butunlay
          yo'qolardi.

          ⚠️ `sticky` + `z-40`: sahifa aylanganda ham joyida qoladi,
          lekin mobil overlay (`z-50`) dan PASTDA turadi — aks holda
          menyu ochiqligida tugma uning ustida ko'rinib qolardi.
        */}
        <div className="flex shrink-0 items-center gap-2 px-3 py-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Menyu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-semibold">Viloyat shtabi</span>
        </div>

        {/*
          ⚠️ `min-w-0`: usiz keng jadval flex konteynerni cho'zib,
          sidebar'ni ekrandan chiqarib yuborardi.

          ⚠️ AYLANISH SHU YERDA (`overflow-y-auto`), sahifada emas —
          sidebar joyida qolishi uchun.
        */}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-2 lg:px-6 lg:pt-4">
          {children}
        </main>
      </div>
    </div>
  );
};

/**
 * MAVZU ALMASHTIRGICH.
 *
 * ⚠️ `mounted` TEKSHIRILADI: `next-themes` joriy mavzuni faqat
 * mijozda biladi va serverda `theme` har doim `undefined`. Shu
 * sababli to'g'ridan-to'g'ri ikona ko'rsatilsa, server "quyosh"
 * chizib, mijoz "oy" ga almashtirib, hydration xatosi berardi.
 */
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled aria-label="Mavzu" />;
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Yorug' rejim" : "Tungi rejim"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
};
