"use client";

/**
 * TASHKILOTLAR — MUROJAATNI BAJARADIGAN TOMON.
 *
 * ── NIMA UCHUN BU SAHIFA BOR ──────────────────────────────────────────
 *
 * Avval "mas'ul tashkilot" faqat MATN edi (yo'nalish sozlamasidagi
 * `orgName`): ilovada "Mas'ul tashkilot: Andijon suv ta'minoti" deb
 * yozilardi, lekin bu MANZIL emasdi. Murojaat unga bormasdi, xabar
 * ketmasdi, u panelga kira olmasdi — shtab xodimi har murojaatni o'qib,
 * tashkilotga QO'LDA (telefon yoki qog'oz bilan) uzatardi.
 *
 * ── IKKI TAB, IKKI BOSHQA SAVOL ───────────────────────────────────────
 *
 *   Tashkilotlar  → KIM bor, uning hisobi va Telegram manzili
 *   Yo'naltirish  → QAYSI murojaat qaysi tashkilotga ketadi
 *
 * ⚠️ BITTA SAHIFADA, IKKI SAHIFADA EMAS: qoida qo'yish uchun
 * tashkilot kerak va ikkisi orasida navigatsiya qilish operatorni
 * "tashkilot qo'shdim — qoida qayerda" degan savolga olib kelardi.
 *
 * ── "IJROCHILAR" BILAN TO'QNASHMAYDI ──────────────────────────────────
 *
 * ⚠️ IKKISI IKKI BOSHQA USTUNNI to'ldiradi: "Ijrochilar" — murojaatni
 * shtabda KIM kuzatadi (MFY × yo'nalish → xodim), bu sahifa — KIM
 * bajaradi (tuman × yo'nalish → tashkilot). Ikkisi bir vaqtda
 * qo'llanadi va "qaysi biri ustun" degan savol yo'q.
 */

import { Building2 } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import { OrgList } from "@/features/organizations/org-list";
import { OrgRoutes } from "@/features/organizations/org-routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { EmptyState } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";

export default function OrganizationsPage() {
  const { can } = useSession();

  if (!can("organizations.view")) {
    return (
      <EmptyState
        icon={Building2}
        title="Sizda bu bo'limga ruxsat yo'q"
        hint="Tashkilotlarni ko'rish huquqi kerak (Tashkilotlar → Ro'yxatni ko'rish)."
      />
    );
  }

  /**
   * ⚠️ KO'RISH VA BOSHQARISH AJRATILGAN: qoida qo'yish murojaat
   * oqimini boshqa tashkilotga burib yuborishi mumkin, hisob
   * yaratish esa PANELGA KIRISH huquqini beradi. Shuning uchun
   * tugmalar `organizations.manage` bilan ko'rinadi — lekin
   * haqiqiy himoya SERVERDA (`@RequirePermissions`).
   */
  const canManage = can("organizations.manage");

  return (
    <>
      <PageHeader title="Tashkilotlar" />

      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Tashkilotlar</TabsTrigger>
          <TabsTrigger value="routes">Yo&apos;naltirish</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <OrgList canManage={canManage} />
        </TabsContent>

        <TabsContent value="routes">
          <OrgRoutes canManage={canManage} />
        </TabsContent>
      </Tabs>
    </>
  );
}
