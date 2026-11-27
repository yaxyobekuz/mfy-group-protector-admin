"use client";

/**
 * "MUROJAATLAR" TABI — RASMIY NAVBAT QANDAY KETYAPTI.
 *
 * ⚠️ "ASOSIY" TABDAN FARQI — CHUQURLIK, TAKRORLASH EMAS: u yerda
 * ikki plitka ("Ochiq", "Muddati o'tgan") va 14 kunlik dinamika
 * bor; bu yerda esa holatlar BO'LIB ko'rsatiladi, davr 30 kun,
 * yo'nalishlar kechikish bilan beriladi va "hal qilib bo'lmaydigan"
 * kesimlar alohida turadi.
 *
 * ⚠️ UCHTA "HAL QILIB BO'LMAYDIGAN" KESIM ALOHIDA BO'LIM:
 * hududsiz, shubhali va takroriy murojaatlar umumiy ro'yxatda
 * yuzlab haqiqiy murojaat orasida KO'RINMAY ketardi — va ularning
 * har biri boshqa chora talab qiladi:
 *
 *   hududsiz  →  MFY biriktirish (tuman xodimi uni ko'rmaydi)
 *   shubhali  →  o'qib ko'rish (matni mazmunsiz)
 *   takroriy  →  bittasini hal qilish (javob hammasiga boradi)
 *
 * ⚠️ SHUBHALI VA TAKRORIY SONI RO'YXAT SO'ROVIDAN OLINADI
 * (`limit: 1` → `total`): `IssueStats` da bu kesimlar yo'q va
 * server uchun yangi endpoint yozish bitta son uchun ortiqcha
 * bo'lardi. Qamrov esa ayni (`/issues` xodim qamrovi bilan
 * kesadi), ya'ni son ro'yxatdagi bilan HAR DOIM bir xil.
 */

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Hourglass,
  MapPinOff,
  MessageSquareWarning,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { useSession } from "@/entities/session/auth-provider";
import { useIssueStats, useIssues } from "@/features/issues/api";
import { useCategoryReport, useDailyReport, useMobileReport } from "@/features/reports/api";
import { ChartFrame } from "@/widgets/dashboard/chart-frame";
import { CategoryBars } from "@/widgets/dashboard/category-bars";
import { Metric, MiniStat, NoData } from "@/widgets/dashboard/parts";
import { StatusDonut } from "@/widgets/dashboard/status-donut";
import { TrendChart } from "@/widgets/dashboard/trend-chart";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

/**
 * ⚠️ `limit: 1` — FAQAT SON KERAK: ro'yxatning o'zi bu yerda
 * ko'rsatilmaydi va 50 ta murojaatni tashish bekorga trafik
 * bo'lardi.
 */
const COUNT_ONLY = { limit: 1 } as const;

export const IssuesTab = () => {
  const { can } = useSession();

  const stats = useIssueStats();
  const suspicious = useIssues({ ...COUNT_ONLY, suspicious: true });
  const duplicates = useIssues({ ...COUNT_ONLY, duplicates: true });

  // ⚠️ `/reports/*` — `reports.view` TALAB QILADI.
  const daily = useDailyReport(30);
  const categories = useCategoryReport({});
  const mobile = useMobileReport({});

  const totals = daily.data?.reduce(
    (acc, point) => ({
      total: acc.total + point.total,
      resolved: acc.resolved + point.resolved,
    }),
    { total: 0, resolved: 0 },
  );

  return (
    <div className="grid auto-rows-min items-start gap-4 lg:grid-cols-6">
      {/* ── 1-QATOR: NAVBAT HOLATLAR BO'YICHA ───────────────── */}
      <div className="lg:col-span-3 xl:col-span-2">
        <StatTile
          label="Yangi"
          value={stats.data?.new ?? "—"}
          icon={MessageSquareWarning}
          featured
          href="/issues?status=new"
        />
      </div>

      <div className="lg:col-span-3 xl:col-span-2">
        <StatTile
          label="Ko'rib chiqilmoqda"
          value={stats.data?.in_progress ?? "—"}
          icon={Hourglass}
          href="/issues?status=in_progress"
        />
      </div>

      <div className="lg:col-span-3 xl:col-span-1">
        <StatTile
          label="Muddati o'tgan"
          value={stats.data?.overdue ?? "—"}
          icon={AlertTriangle}
          tone={stats.data?.overdue ? "danger" : "default"}
          href="/issues?overdue=true"
        />
      </div>

      <div className="lg:col-span-3 xl:col-span-1">
        {/*
          ⚠️ FAQAT `resolved`, RAD ETILGANLARI QO'SHILMAYDI: aks
          holda plitkadagi son (hal qilingan + rad etilgan) bosib
          ochilgan ro'yxatdan KATTA bo'lardi — havola esa bitta
          holatni ko'rsatadi. Rad etilganlari halqada ko'rinadi.
        */}
        <StatTile
          label="Hal qilingan"
          value={stats.data?.resolved ?? "—"}
          icon={CheckCircle2}
          tone="success"
          href="/issues?status=resolved"
        />
      </div>

      {/* ── 2-QATOR: DINAMIKA + HOLAT HALQASI ───────────────── */}
      {can("reports.view") ? (
        <ChartFrame
          title="Murojaat oqimi"
          subtitle="Oxirgi 30 kun"
          className="lg:col-span-6 xl:col-span-4"
        >
          <div className="mb-4 flex flex-wrap gap-8">
            <Metric label="Kelgan" value={totals?.total ?? "—"} />
            <Metric label="Hal qilingan" value={totals?.resolved ?? "—"} tone="primary" />
            <Metric
              label="Hal qilish ulushi"
              value={
                totals && totals.total > 0
                  ? `${Math.round((totals.resolved / totals.total) * 100)}%`
                  : "—"
              }
            />
            {/*
              ⚠️ O'RTACHA JAVOB VAQTI SHU QATORDA: "400 ta kelgan,
              380 tasi hal qilingan" degan juftlik yaxshi ko'rinadi,
              lekin javob 9 kunda berilgan bo'lsa — xizmat yomon
              ishlayapti. Ikkisi birga turmasa, bu farq ko'rinmasdi.
            */}
            {mobile.data?.avgResponseHours != null ? (
              <Metric
                label="O'rtacha javob"
                value={`${mobile.data.avgResponseHours} soat`}
              />
            ) : null}
          </div>

          {daily.data && daily.data.length > 0 ? (
            <TrendChart data={daily.data} />
          ) : (
            <NoData />
          )}
        </ChartFrame>
      ) : null}

      <ChartFrame
        title="Holat taqsimoti"
        href="/issues"
        hrefLabel="Ro'yxat"
        // ⚠️ `lg` DA BUTUN QATOR (`overview-tab` dagi ayni sabab):
        // pastdagi ikki karta yonma-yon juft bo'lib turadi.
        className="lg:col-span-6 xl:col-span-2"
      >
        <StatusDonut counts={stats.data} />
      </ChartFrame>

      {/* ── 3-QATOR: YO'NALISHLAR + ILOVA ───────────────────── */}
      {can("reports.view") ? (
        <ChartFrame
          title="Eng ko'p yo'nalishlar"
          subtitle="Qizil rozetka — muddati o'tganlari"
          className="lg:col-span-3"
        >
          <CategoryBars
            rows={(categories.data ?? []).map((row) => ({
              id: row.categoryId,
              /*
               * ⚠️ OTA YO'NALISH NOMI BILAN: yakka "Ichimlik suvi"
               * kontekstsiz qolardi — AI promptidagi ayni sabab.
               * Ichimlik suvi bilan issiqlik ta'minoti ikki boshqa
               * tashkilot.
               */
              name: row.parentName ? `${row.parentName} → ${row.name}` : row.name,
              color: row.color,
              icon: row.icon,
              count: row.count,
              overdue: row.overdue,
            }))}
            limit={7}
          />
        </ChartFrame>
      ) : null}

      {can("citizens.view") && can("reports.view") ? (
        <ChartFrame
          title="Ilovadan kelganlar"
          subtitle="Mini App va mobil ilova"
          className="lg:col-span-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              icon={Smartphone}
              label="Jami"
              value={mobile.data?.total ?? "—"}
              href="/issues?source=mobile"
            />
            <MiniStat
              icon={MessageSquareWarning}
              label="Ochiq"
              value={mobile.data?.open ?? "—"}
            />
            {/*
              ⚠️ "MUDDATIDA BAJARILGAN" ULUSHI — HAL QILISH
              ULUSHIDAN BOSHQA SAVOL: murojaat hal qilingan
              bo'lishi mumkin, lekin kech. Faqat birinchisi
              ko'rsatilsa, kechikish ko'rinmas bo'lib qolardi.
            */}
            <MiniStat
              icon={Clock}
              label="Muddatida bajarilgan"
              value={
                mobile.data?.slaOnTimeRate != null
                  ? `${mobile.data.slaOnTimeRate}%`
                  : "—"
              }
              tone="primary"
            />
            <MiniStat
              icon={AlertTriangle}
              label="Muddati o'tgan"
              value={mobile.data?.overdue ?? "—"}
              tone={mobile.data?.overdue ? "danger" : "default"}
            />
          </div>
        </ChartFrame>
      ) : null}

      {/*
        ── 4-QATOR: E'TIBOR TALAB QILADIGAN KESIMLAR ──────────

        ⚠️ UCHALASI BIR XIL YO'L BILAN HAL QILINMAYDI (yuqoridagi
        izoh), shuning uchun ular UCHTA alohida havola — bitta
        "muammoli murojaatlar" ro'yxatiga yig'ilsa, operator
        qaysi biriga nima qilishni bilmasdi.

        ⚠️ KARTA FAQAT SON BO'LSA KO'RINADI: hammasi nol bo'lgan
        toza navbatda bu bo'lim panelni bekorga uzaytirardi.
      */}
      {(stats.data?.unassignedMahalla ?? 0) > 0 ||
      (suspicious.data?.total ?? 0) > 0 ||
      (duplicates.data?.total ?? 0) > 0 ? (
        <ChartFrame title="Aralashuv kerak" className="lg:col-span-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.data?.unassignedMahalla ? (
              <MiniStat
                icon={MapPinOff}
                label="Hudud belgilanmagan"
                value={stats.data.unassignedMahalla}
                tone="warning"
                href="/issues"
              />
            ) : null}

            {suspicious.data?.total ? (
              <MiniStat
                icon={TriangleAlert}
                label="Shubhali matn"
                value={suspicious.data.total}
                tone="warning"
                href="/issues?suspicious=true"
              />
            ) : null}

            {duplicates.data?.total ? (
              <MiniStat
                icon={Copy}
                label="Takroriy"
                value={duplicates.data.total}
                href="/issues?duplicates=true"
              />
            ) : null}
          </div>
        </ChartFrame>
      ) : null}
    </div>
  );
};
