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
import { LogOut, Menu, Moon, Sun } from "lucide-react";
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
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 px-2 pt-2">
        <p className="font-semibold leading-tight">Viloyat shtabi</p>
        <p className="text-xs text-muted-foreground">MFY muammolari</p>
      </div>

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
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              isActive
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {/* ⚠️ NOL KO'RSATILMAYDI: "0" yorlig'i e'tiborni
                tortadi, lekin hech narsa bildirmaydi. */}
            {count > 0 ? (
              <Badge className="tabular bg-primary/10 text-primary">{count}</Badge>
            ) : null}
          </Link>
        );
      })}

      <div className="mt-auto border-t pt-3">
        <div className="px-2.5 pb-2">
          <p className="truncate text-sm font-medium">
            {user.username}
          </p>
          <p className="text-xs text-muted-foreground">
            {USER_ROLE[user.role]} · {SCOPE_KIND[user.scopeKind]}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" />
          Chiqish
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Doimiy sidebar — katta ekranda. */}
      <aside className="hidden w-60 shrink-0 border-r bg-card lg:block">
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
          <aside className="relative h-full w-64 border-r bg-card">{sidebar}</aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Menyu"
          >
            <Menu className="size-4" />
          </Button>

          <div className="flex-1" />

          <ThemeToggle />
        </header>

        {/*
          ⚠️ `min-w-0`: usiz keng jadval flex konteynerni cho'zib,
          sidebar'ni ekrandan chiqarib yuborardi.
        */}
        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
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
