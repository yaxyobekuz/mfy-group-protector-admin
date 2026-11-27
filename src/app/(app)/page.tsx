"use client";

/**
 * BOSHQARUV PANELI — TO'RT TAB.
 *
 * ⚠️ BU HISOBOT SAHIFASI EMAS: panel "hozir nima kutib turibdi"
 * degan savolga javob beradi — ko'rilmagan signallar, javobsiz
 * murojaatlar, biriktirilmagan guruhlar. Shuning uchun har plitka
 * HAVOLA: operator raqamni ko'rib, darhol ishga kirishishi kerak.
 *
 * ── NIMA UCHUN TABLAR ─────────────────────────────────────────
 *
 * ⚠️ AVVAL HAMMASI BITTA UZUN USTUNDA EDI: signallar, murojaatlar,
 * kuzatuv, auditoriya, ilova va tumanlar xaritasi — oltita blok
 * ketma-ket. Ekranga faqat birinchi ikkisi sig'ardi, qolganini
 * ko'rish uchun uzoq pastga surish kerak edi va xodim ularning
 * BORLIGINI ham bilmasdi.
 *
 * ⚠️ TABLAR SAHIFANI BO'LADI, MA'LUMOTNI YASHIRMAYDI: eng
 * shoshilinch raqamlar ("Asosiy") birinchi ekranda to'liq
 * ko'rinadi, chuqur kesimlar esa o'z tabida — har biri BITTA
 * savolga javob beradi:
 *
 *   Asosiy      →  hozir nima qilish kerak (hammasining ustidan)
 *   Murojaatlar →  rasmiy navbat qanday ketyapti
 *   Signallar   →  AI guruhlarda nima topdi
 *   Xarita      →  qayerda nima bo'lyapti
 *
 * ⚠️ FAOL TAB O'Z HOOKLARINI O'ZI OLADI: Radix faol bo'lmagan
 * tabni UMUMAN chizmaydi, ya'ni tab mazmuni alohida komponentda
 * (`overview-tab.tsx` va boshqalar) bo'lgani uchun uning
 * so'rovlari ham faqat ochilganda ketadi. Avval sahifa ochilishi
 * bilan OLTITA so'rov birdan ketardi.
 *
 * ⚠️ TAB URL'DA SAQLANADI (`?tab=`): sahifa yangilanganda yoki
 * havola ulashilganda xodim O'SHA kesimda qoladi. Faqat
 * `useState` bo'lsa, murojaatni ochib, orqaga qaytgan odam yana
 * "Asosiy" dan boshlardi.
 *
 * ⚠️ RUXSATI YO'Q TAB KO'RSATILMAYDI, lekin himoya SERVERDA:
 * menyuni yashirish — qulaylik, xavfsizlik emas (`nav.ts` dagi
 * ayni qoida).
 *
 * ⚠️ URL'DAGI NOTANISH YOKI YOPIQ TAB — BIRINCHI OCHIQ TABGA
 * TUSHADI: aks holda havola bo'sh ekran ochib, u "tizim buzilgan"
 * dek ko'rinardi.
 */

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@/entities/session/auth-provider";
import { useSignalStatus } from "@/features/signals/api";
import { formatRelativeUz } from "@/shared/lib/date";
import { EmptyState } from "@/shared/ui/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { IssuesTab } from "@/widgets/dashboard/issues-tab";
import { MapTab } from "@/widgets/dashboard/map-tab";
import { OverviewTab } from "@/widgets/dashboard/overview-tab";
import { SignalsTab } from "@/widgets/dashboard/signals-tab";

/**
 * TABLAR — YAGONA RO'YXAT.
 *
 * ⚠️ TARTIB MA'NOLI: "Asosiy" birinchi (u hammasining ustidan
 * qarash), keyin kundalik ish ("Murojaatlar", "Signallar"), oxirida
 * tahlil ("Xarita"). Xarita boshiga qo'yilsa, ko'rilmagan
 * signallar ekrandan pastga tushib ketardi.
 *
 * ⚠️ "Asosiy" DA RUXSAT YO'Q: uning ichidagi har blok O'Z
 * ruxsatini tekshiradi va hech qanday ruxsati yo'q xodim
 * sahifaning o'ziga ham kira olmaydi (pastdagi `hasAnyAccess`).
 */
interface DashboardTab {
  value: string;
  label: string;
  /** Ko'rinishi uchun kerakli ruxsat (`undefined` — hammaga). */
  permission?: string;
}

/**
 * ⚠️ BELGI YO'Q — FAQAT YORLIQ: to'rtta tabning nomi
 * ("Asosiy", "Murojaatlar", "Signallar", "Xarita") o'zi
 * yetarlicha aniq va belgi ularga hech narsa qo'shmasdi.
 * Yon menyuda esa belgi KERAK — u yig'ilganda faqat belgi
 * qoladi (`app-shell.tsx`), bu yerda esa ro'yxat hech qachon
 * yig'ilmaydi.
 */
const TABS: DashboardTab[] = [
  { value: "overview", label: "Asosiy" },
  { value: "issues", label: "Murojaatlar", permission: "issues.view" },
  { value: "signals", label: "Signallar", permission: "signals.view" },
  { value: "map", label: "Xarita", permission: "reports.view" },
];

export default function DashboardPage() {
  const { can, user } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const signalStatus = useSignalStatus();

  /**
   * ⚠️ HECH QANDAY RUXSAT BO'LMASA — ANIQ XABAR. Bo'sh ekran
   * ko'rsatilsa, xodim "tizim buzilgan" deb o'ylardi; aslida
   * ma'muriyat unga hali ruxsat bermagan.
   */
  const hasAnyAccess =
    can("signals.view") || can("issues.view") || can("groups.view");

  const visible = useMemo(
    () => TABS.filter((tab) => !tab.permission || can(tab.permission)),
    [can],
  );

  const requested = searchParams.get("tab");
  const active =
    visible.find((tab) => tab.value === requested)?.value ??
    visible[0]?.value ??
    "overview";

  /**
   * ⚠️ `replace`, `push` EMAS: tab almashtirish — ko'rinish
   * o'zgarishi, navigatsiya emas. `push` bo'lsa, to'rt tabni
   * ko'rgan odam "orqaga" tugmasini to'rt marta bosib, shundagina
   * oldingi sahifaga qaytardi.
   *
   * ⚠️ `scroll: false`: tab almashganda sahifa boshiga sakrash
   * KERAK EMAS — tablist sahifaning yuqorisida va u allaqachon
   * ko'rinib turadi.
   */
  const select = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "overview") next.delete("tab");
    else next.set("tab", value);

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  if (!hasAnyAccess) {
    return (
      <EmptyState
        title="Sizga hali hech qanday bo'lim ochilmagan"
        hint="Ma'muriyatga murojaat qiling — ular ruxsatlarni Adminlar bo'limida beradi."
      />
    );
  }

  return (
    <>
      {/*
        SALOMLASHUV.

        ⚠️ `PageHeader` ISHLATILMAYDI: bu sahifada sarlavha ikki
        qatorli va ism bilan — boshqa sahifalardagi bir qatorli
        sarlavhadan ataylab farq qiladi, chunki bu "uy" sahifasi.
      */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
          Xush kelibsiz, {user?.username}
        </h1>
        {/*
          ⚠️ OXIRGI TAHLIL VAQTI SARLAVHA OSTIDA: u BUTUN panelning
          yoshini aytadi — "signal yo'q" degan raqam tahlil bir
          soat oldin ishlaganini bilmasa, ma'nosiz.
        */}
        {can("signals.view") && signalStatus.data?.lastRunAt ? (
          <p className="mt-1.5 text-sm text-muted-foreground">
            Oxirgi tahlil: {formatRelativeUz(signalStatus.data.lastRunAt)}
          </p>
        ) : null}
      </div>

      <Tabs value={active} onValueChange={select}>
        {/*
          ⚠️ RO'YXAT SURILADI, SIQILMAYDI: telefonda to'rt tab bir
          qatorga sig'maydi va siqilsa yorliqlar qirqilib ketardi.

          ⚠️ `overflow-y-hidden` MAJBURIY, YAKKA `overflow-x-auto`
          YETMAYDI: CSS da bir o'q `visible` bo'lmay qolsa,
          ikkinchisi avtomatik `auto` ga aylanadi — natijada
          ro'yxatning o'ng chetida VERTIKAL scroll paydo bo'lardi
          (balandlik `h-9` ga qotirilgan, ya'ni mazmun unga bir
          piksel bilan sig'adi).
        */}
        <TabsList className="max-w-full overflow-x-auto overflow-y-hidden">
          {visible.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/*
          ⚠️ HAR TAB O'Z KOMPONENTIDA: shunda faol bo'lmagan tab
          chizilmaydi va uning so'rovlari ham ketmaydi (yuqoridagi
          izoh).
        */}
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        {can("issues.view") ? (
          <TabsContent value="issues">
            <IssuesTab />
          </TabsContent>
        ) : null}

        {can("signals.view") ? (
          <TabsContent value="signals">
            <SignalsTab />
          </TabsContent>
        ) : null}

        {can("reports.view") ? (
          <TabsContent value="map">
            <MapTab />
          </TabsContent>
        ) : null}
      </Tabs>
    </>
  );
}
