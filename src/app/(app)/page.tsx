"use client";

/**
 * BOSHQARUV PANELI — "hozir nima qilish kerak".
 *
 * ⚠️ BU HISOBOT SAHIFASI EMAS. Hisobot "nima bo'ldi" degan savolga
 * javob beradi (`/reports`), bu sahifa esa "hozir nima kutib
 * turibdi": ko'rilmagan signallar, javobsiz murojaatlar,
 * biriktirilmagan guruhlar. Shuning uchun har plitka HAVOLA —
 * operator raqamni ko'rib, darhol ishga kirishishi kerak.
 *
 * ── BENTO TO'R ──────────────────────────────────────────────────
 *
 * ⚠️ KATAKCHALAR HAR XIL O'LCHAMDA, VA BU MA'NOLI: katakcha
 * o'lchami uning MUHIMLIGINI bildiradi. Hammasi bir xil bo'lsa,
 * operator qaysi biriga avval qarashni bilmasdi — bu esa
 * panelning asosiy vazifasiga zid.
 *
 * ⚠️ TARTIB — SHOSHILINCHLIK BO'YICHA, go'zallik bo'yicha emas:
 * (1) e'tibor talab qiladigan raqamlar, (2) dinamika va holat,
 * (3) yo'nalish/hudud kesimi, (4) ilova va kuzatuv. Yuqoridagi
 * qator — "bugun nima qilish kerak", pastdagilar — "ishlar
 * qanday ketyapti".
 *
 * ⚠️ DIAGRAMMALARDA RANG YAKKA O'ZI MA'LUMOT TASHIMAYDI: har
 * birida yorliq yoki legenda bor. Sabab `chart-colors.ts` da —
 * ro'yxatning birinchi ikki rangi daltonikda yaqin.
 */

import {
  AlertTriangle,
  ArrowRight,
  MapPinOff,
  MessageSquareWarning,
  Radio as RadioIcon,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { useSession } from "@/entities/session/auth-provider";
import { useGroupStats } from "@/features/groups/api";
import { useIssueStats } from "@/features/issues/api";
import { useSignalCounts, useSignalStatus } from "@/features/signals/api";
import {
  useCategoryReport,
  useDailyReport,
  useMobileReport,
} from "@/features/reports/api";
import { formatRelativeUz } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/states";
import { StatTile } from "@/widgets/stat-tile/stat-tile";
import { CategoryBars } from "@/widgets/dashboard/category-bars";
import { ChartFrame } from "@/widgets/dashboard/chart-frame";
import { StatusDonut } from "@/widgets/dashboard/status-donut";
import { TrendChart } from "@/widgets/dashboard/trend-chart";
import { DistrictMapPanel } from "@/widgets/district-map/district-map-panel";

export default function DashboardPage() {
  const { can, user } = useSession();

  const signalCounts = useSignalCounts();
  const signalStatus = useSignalStatus();
  const issueStats = useIssueStats();
  const groupStats = useGroupStats();
  const daily = useDailyReport(14);
  // ⚠️ `/reports/*` server'da `reports.view` TALAB QILADI: hooklar
  // faqat shu ruxsat bo'lganda ishga tushadi, aks holda 403 bo'lardi.
  const mobile = useMobileReport({});
  const categories = useCategoryReport({});

  /**
   * ⚠️ HECH QANDAY RUXSAT BO'LMASA — ANIQ XABAR. Bo'sh ekran
   * ko'rsatilsa, xodim "tizim buzilgan" deb o'ylardi; aslida
   * ma'muriyat unga hali ruxsat bermagan.
   */
  const hasAnyAccess = can("signals.view") || can("issues.view") || can("groups.view");

  if (!hasAnyAccess) {
    return (
      <EmptyState
        title="Sizga hali hech qanday bo'lim ochilmagan"
        hint="Ma'muriyatga murojaat qiling — ular ruxsatlarni Adminlar bo'limida beradi."
      />
    );
  }

  const totals = daily.data?.reduce(
    (acc, point) => ({
      total: acc.total + point.total,
      resolved: acc.resolved + point.resolved,
    }),
    { total: 0, resolved: 0 },
  );

  return (
    <>
      {/*
        SALOMLASHUV.

        ⚠️ `PageHeader` ISHLATILMAYDI: bu sahifada sarlavha ikki
        qatorli va ism bilan — boshqa sahifalardagi bir qatorli
        sarlavhadan ataylab farq qiladi, chunki bu "uy" sahifasi.
      */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            Xush kelibsiz, {user?.username}
          </h1>
          {signalStatus.data?.lastRunAt ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Oxirgi tahlil: {formatRelativeUz(signalStatus.data.lastRunAt)}
            </p>
          ) : null}
        </div>

        {can("signals.view") ? (
          <Button asChild>
            <Link href="/signals">
              Signallarni ko&apos;rish
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      {/*
        ── BENTO TO'R ────────────────────────────────────────

        ⚠️ `auto-rows-min` + `items-start`: katakchalar O'Z
        mazmuniga qarab balandlik oladi. Standart `stretch`
        bilan kaltaroq katakcha uzunining balandligiga
        cho'zilib, ichida katta bo'sh maydon qolardi.
      */}
      <div className="grid auto-rows-min items-start gap-4 lg:grid-cols-6">
        {/* ── 1-QATOR: E'TIBOR TALAB QILADIGANLAR ──────────── */}
        {can("signals.view") ? (
          <div className="lg:col-span-3 xl:col-span-2">
            <StatTile
              label="Ko'rilmagan signallar"
              value={signalCounts.data?.new ?? "—"}
              icon={RadioIcon}
              /*
               * ⚠️ AYNAN SHU PLITKA TO'LDIRILGAN: panelning asosiy
               * ishi — signalni ko'rib chiqish. Boshqasi to'ldirilsa
               * operator e'tibori ikkinchi darajali raqamga ketardi.
               */
              featured
              hint={
                signalCounts.data?.highNew
                  ? `${signalCounts.data.highNew} tasi yuqori jiddiylikda`
                  : "Tekshirib chiqish kerak"
              }
              href="/signals"
            />
          </div>
        ) : null}

        {can("issues.view") ? (
          <>
            <div className="lg:col-span-3 xl:col-span-2">
              <StatTile
                label="Ochiq murojaatlar"
                value={issueStats.data?.open ?? "—"}
                icon={MessageSquareWarning}
                hint="Yangi va ko'rib chiqilmoqda"
                href="/issues?status=new"
              />
            </div>

            <div className="lg:col-span-3 xl:col-span-1">
              <StatTile
                label="Muddati o'tgan"
                value={issueStats.data?.overdue ?? "—"}
                icon={AlertTriangle}
                tone={issueStats.data?.overdue ? "danger" : "default"}
                hint={issueStats.data?.overdue ? "Kechikkan javob" : "Kechikish yo'q"}
                href="/issues?overdue=true"
              />
            </div>
          </>
        ) : null}

        {can("groups.view") ? (
          <div className="lg:col-span-3 xl:col-span-1">
            <StatTile
              label="MFY biriktirilmagan"
              value={groupStats.data?.unassigned ?? "—"}
              icon={MapPinOff}
              tone={groupStats.data?.unassigned ? "warning" : "default"}
              // ⚠️ IZOH SABABNI AYTADI: biriktirilmagan guruh
              // kuzatuvga ham qo'yilmaydi va bu "ish qoldi" degani.
              hint="Biriktirilmasa kuzatuvga qo'yilmaydi"
              href="/groups?unassigned=true"
            />
          </div>
        ) : null}

        {/* ── 2-QATOR: DINAMIKA (katta) + HOLAT HALQASI ────── */}
        {can("reports.view") ? (
          <ChartFrame
            title="Oxirgi 14 kun"
            subtitle="Kunlik murojaat oqimi"
            href="/reports"
            className="lg:col-span-6 xl:col-span-4"
          >
            {/* ⚠️ IKKI YIRIK RAQAM DIAGRAMMA USTIDA: grafik
                yo'nalishni ko'rsatadi, raqam esa aniq qiymatni —
                operatorga ikkalasi ham kerak. */}
            <div className="mb-4 flex flex-wrap gap-8">
              <Metric label="Jami murojaat" value={totals?.total ?? "—"} />
              <Metric
                label="Hal qilingan"
                value={totals?.resolved ?? "—"}
                tone="primary"
              />
              <Metric
                label="Hal qilish ulushi"
                value={
                  totals && totals.total > 0
                    ? `${Math.round((totals.resolved / totals.total) * 100)}%`
                    : "—"
                }
              />
            </div>

            {daily.data && daily.data.length > 0 ? (
              <TrendChart data={daily.data} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Hali ma&apos;lumot yo&apos;q
              </p>
            )}
          </ChartFrame>
        ) : null}

        {can("issues.view") ? (
          <ChartFrame
            title="Murojaatlar holati"
            subtitle="Hozirgi taqsimot"
            href="/issues"
            hrefLabel="Ro'yxat"
            className="lg:col-span-3 xl:col-span-2"
          >
            <StatusDonut counts={issueStats.data} />

            {issueStats.data?.unassignedMahalla ? (
              <Link
                href="/issues"
                className="mt-4 block rounded-xl bg-severity-normal/10 px-3.5 py-2.5 text-xs text-severity-normal transition-colors hover:bg-severity-normal/15"
              >
                {issueStats.data.unassignedMahalla} ta murojaatda hudud
                belgilanmagan
              </Link>
            ) : null}
          </ChartFrame>
        ) : null}

        {/* ── 3-QATOR: YO'NALISHLAR + KUZATUV ──────────────── */}
        {can("reports.view") ? (
          <ChartFrame
            title="Eng ko'p yo'nalishlar"
            subtitle="Murojaat soni bo'yicha"
            href="/reports?tab=categories"
            className="lg:col-span-3 xl:col-span-3"
          >
            <CategoryBars
              rows={(categories.data ?? []).map((row) => ({
                id: row.categoryId,
                name: row.name,
                color: row.color,
                icon: row.icon,
                count: row.count,
              }))}
            />
          </ChartFrame>
        ) : null}

        {can("groups.view") ? (
          <ChartFrame
            title="Kuzatuv holati"
            subtitle="Telegram guruhlari"
            href="/groups"
            hrefLabel="Guruhlar"
            className="lg:col-span-3 xl:col-span-3"
          >
            <div className="space-y-3">
              <Row label="Jami guruh" value={groupStats.data?.total ?? "—"} />
              <Row
                label="Kuzatuvda (rasmiy)"
                value={groupStats.data?.official ?? "—"}
              />
              <Row label="Qalqon yoqilgan" value={groupStats.data?.guarded ?? "—"} />
              <Row
                label="Navbatdagi xabar"
                value={groupStats.data?.pendingMessages ?? "—"}
                // ⚠️ IZOH: navbat uzun bo'lishi NORMAL (tahlil
                // har 30 daqiqada). Operator buni muammo deb
                // o'ylab qolmasligi kerak.
                hint="Keyingi tahlilda ko'riladi"
              />
            </div>
          </ChartFrame>
        ) : null}

        {/* ── 4-QATOR: ILOVADAN KELGAN MUROJAATLAR ─────────── */}
        {/* ⚠️ `reports.view` KERAK: kartadagi raqamlar
            `/reports/mobile` dan keladi va u shu ruxsatga ega. */}
        {can("citizens.view") && can("reports.view") ? (
          <ChartFrame
            title="Ilovadan kelgan murojaatlar"
            subtitle="Fuqaro Mini App"
            href="/reports?tab=mobile"
            hrefLabel="Analitika"
            className="lg:col-span-6"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat
                icon={Smartphone}
                label="Jami (ilova)"
                value={mobile.data?.total ?? "—"}
              />
              <MiniStat
                icon={MessageSquareWarning}
                label="Ochiq"
                value={mobile.data?.open ?? "—"}
              />
              <MiniStat
                icon={Users}
                label="Faol fuqarolar"
                value={mobile.data?.citizens.active ?? "—"}
                tone="primary"
              />
              <MiniStat
                icon={TrendingUp}
                label="O'rtacha javob"
                value={
                  mobile.data?.avgResponseHours != null
                    ? `${mobile.data.avgResponseHours} soat`
                    : "—"
                }
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/citizens">Fuqarolar</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/map">Xarita</Link>
              </Button>
            </div>
          </ChartFrame>
        ) : null}
      </div>

      {/*
        ── TUMANLAR XARITASI ──────────────────────────────────

        ⚠️ BENTO TO'RIDAN TASHQARIDA, TAGIDA: blokning o'z
        ichki to'ri bor (xarita + yon ustun) va uni 6 ustunli
        to'r ichiga tiqish ikki qavatli to'r hosil qilardi —
        tor ekranda xarita siqilib, tumanlar o'qilmay qolardi.

        ⚠️ ENG PASTDA: boshqaruv panelining yuqori qismi "hozir
        nima qilish kerak" (raqamlar, havolalar), xarita esa
        "qayerda nima bo'lyapti" — bu TAHLIL, shoshilinch ish
        emas. Yuqoriga qo'yilsa, ko'rilmagan signallar
        ekrandan pastga tushib ketardi.
      */}
      {can("reports.view") ? (
        <div className="mt-4">
          <DistrictMapPanel />
        </div>
      ) : null}
    </>
  );
}

/**
 * YIRIK KO'RSATKICH — karta ichida.
 *
 * ⚠️ `StatTile` DAN FARQI: bu havola emas va o'z kartasi yo'q —
 * u boshqa ko'rsatkichlar bilan BIR kartada turadi.
 */
const Metric = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "primary";
}) => (
  <div>
    <p className="mb-1 text-xs text-muted-foreground">{label}</p>
    <p
      className={`metric text-3xl font-semibold ${
        tone === "primary" ? "text-primary" : ""
      }`}
    >
      {value}
    </p>
  </div>
);

/**
 * IXCHAM KO'RSATKICH — belgisi bilan.
 *
 * ⚠️ `Metric` DAN FARQI: bu TO'RTTALIK qatorda turadi va raqami
 * kichikroq. Yirik `Metric` o'lchamida to'rttasi bir qatorga
 * sig'masdi.
 */
const MiniStat = ({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Smartphone;
  label: string;
  value: number | string;
  tone?: "default" | "primary";
}) => (
  <div className="rounded-xl bg-secondary/50 p-3.5">
    <div className="mb-2 flex items-center gap-2">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <p className="truncate text-xs text-muted-foreground">{label}</p>
    </div>
    <p
      className={`metric text-2xl font-semibold ${
        tone === "primary" ? "text-primary" : ""
      }`}
    >
      {value}
    </p>
  </div>
);

const Row = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) => (
  <div className="flex items-start justify-between gap-2 text-sm">
    <div>
      <p>{label}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    <p className="tabular font-semibold">{value}</p>
  </div>
);
