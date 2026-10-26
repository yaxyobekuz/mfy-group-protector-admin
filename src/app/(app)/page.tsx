"use client";

/**
 * BOSHQARUV PANELI — "hozir nima qilish kerak".
 *
 * ⚠️ BU HISOBOT SAHIFASI EMAS. Hisobot "nima bo'ldi" degan savolga
 * javob beradi (`/reports`), bu sahifa esa "hozir nima kutib
 * turibdi": ko'rilmagan signallar, javobsiz murojaatlar,
 * biriktirilmagan guruhlar. Shuning uchun har plitka HAVOLA —
 * operator raqamni ko'rib, darhol ishga kirishishi kerak.
 */

import {
  AlertTriangle,
  ArrowRight,
  MapPinOff,
  MessageSquareWarning,
  Radio as RadioIcon,
} from "lucide-react";
import Link from "next/link";

import { useSession } from "@/entities/session/auth-provider";
import { useGroupStats } from "@/features/groups/api";
import { useIssueStats } from "@/features/issues/api";
import { useSignalCounts, useSignalStatus } from "@/features/signals/api";
import { useDailyReport } from "@/features/reports/api";
import { formatRelativeUz } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/states";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

export default function DashboardPage() {
  const { can, user } = useSession();

  const signalCounts = useSignalCounts();
  const signalStatus = useSignalStatus();
  const issueStats = useIssueStats();
  const groupStats = useGroupStats();
  const daily = useDailyReport(14);

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

      {/* ── E'TIBOR TALAB QILADIGANLAR ──────────────────────── */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {can("signals.view") ? (
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
        ) : null}

        {can("issues.view") ? (
          <>
            <StatTile
              label="Ochiq murojaatlar"
              value={issueStats.data?.open ?? "—"}
              icon={MessageSquareWarning}
              hint="Yangi va ko'rib chiqilmoqda"
              href="/issues?status=new"
            />

            <StatTile
              label="Muddati o'tgan"
              value={issueStats.data?.overdue ?? "—"}
              icon={AlertTriangle}
              tone={issueStats.data?.overdue ? "danger" : "default"}
              hint={issueStats.data?.overdue ? "Kechikkan javob" : "Kechikish yo'q"}
              href="/issues?overdue=true"
            />
          </>
        ) : null}

        {can("groups.view") ? (
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
        ) : null}
      </div>

      {/*
        ⚠️ `items-start`: kartalar O'Z mazmuniga qarab balandlik
        oladi. Standart `stretch` bilan kaltaroq karta uzunining
        balandligiga cho'zilib, ichida katta bo'sh maydon
        qolardi.
      */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* ── Oxirgi 14 kun — ENG KATTA, 2 ustun ─────────────── */}
        {can("reports.view") ? (
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle>Oxirgi 14 kun</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reports">
                  Batafsil
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-8">
                <Metric
                  label="Jami murojaat"
                  value={daily.data?.reduce((sum, p) => sum + p.total, 0) ?? "—"}
                />
                <Metric
                  label="Hal qilingan"
                  value={daily.data?.reduce((sum, p) => sum + p.resolved, 0) ?? "—"}
                  tone="primary"
                />
              </div>

              {daily.data && daily.data.length > 0 ? (
                <Sparkline points={daily.data.map((point) => point.total)} />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Hali ma&apos;lumot yo&apos;q
                </p>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* ── Kuzatuv holati ─────────────────────────────────── */}
        {can("groups.view") ? (
          <Card>
            <CardHeader>
              <CardTitle>Kuzatuv holati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Jami guruh" value={groupStats.data?.total ?? "—"} />
              <Row
                label="Kuzatuvda (rasmiy)"
                value={groupStats.data?.official ?? "—"}
              />
              <Row
                label="Navbatdagi xabar"
                value={groupStats.data?.pendingMessages ?? "—"}
                // ⚠️ IZOH: navbat uzun bo'lishi NORMAL (tahlil
                // har 30 daqiqada). Operator buni muammo deb
                // o'ylab qolmasligi kerak.
                hint="Keyingi tahlilda ko'riladi"
              />

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/groups">Guruhlarni ko&apos;rish</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* ── Murojaatlar holati ─────────────────────────────── */}
        {can("issues.view") ? (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Murojaatlar</CardTitle>
            </CardHeader>
            <CardContent>
              {/*
                ⚠️ TO'RT HOLAT YONMA-YON: ular bir-birining
                MUQOBILI (murojaat bir vaqtda faqat bitta holatda)
                va ustma-ust ro'yxatda bu ko'rinmasdi.
              */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Yangi" value={issueStats.data?.new ?? "—"} />
                <Metric
                  label="Ko'rib chiqilmoqda"
                  value={issueStats.data?.in_progress ?? "—"}
                />
                <Metric
                  label="Hal qilindi"
                  value={issueStats.data?.resolved ?? "—"}
                  tone="primary"
                />
                <Metric
                  label="Rad etildi"
                  value={issueStats.data?.rejected ?? "—"}
                />
              </div>

              {issueStats.data?.unassignedMahalla ? (
                <p className="mt-4 rounded-xl bg-severity-normal/10 px-3.5 py-2.5 text-xs text-severity-normal">
                  {issueStats.data.unassignedMahalla} ta murojaatda hudud
                  belgilanmagan
                </p>
              ) : null}

              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/issues">Murojaatlarni ko&apos;rish</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
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

const Row = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) => (
  <div className="flex items-start justify-between gap-2">
    <div>
      <p>{label}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    <p className="tabular font-semibold">{value}</p>
  </div>
);

/**
 * ODDIY USTUNLI DIAGRAMMA.
 *
 * ⚠️ `recharts` ISHLATILMAYDI: bu 14 ta ustun va kutubxona bu yerda
 * ~100 KB JS qo'shardi — faqat sarlavhada turgan kichik grafik
 * uchun. Hisobot sahifasida esa u o'rinli (o'qlar, tooltip,
 * bir nechta seriya).
 *
 * ⚠️ BO'SH MA'LUMOTDA 0 GA BO'LISH: `max` kamida 1 bo'ladi.
 */
const Sparkline = ({ points }: { points: number[] }) => {
  const max = Math.max(1, ...points);

  return (
    /*
     * ⚠️ `max-w-[2.5rem]` HAR USTUNDA: kunlar kam bo'lganda
     * `flex-1` ularni butun kenglikka cho'zib, bitta ustun
     * "devor" bo'lib qolardi — grafik emas, bitta katta
     * to'rtburchak ko'rinardi.
     */
    <div className="flex h-20 items-end gap-1.5 sm:h-24">
      {points.map((value, index) => {
        // ⚠️ OXIRGI USTUN TA'KIDLANGAN: u BUGUN va operator
        // ko'pincha aynan shuni qidiradi.
        const isLast = index === points.length - 1;

        return (
          <div
            key={index}
            className={`max-w-[2.5rem] flex-1 rounded-md transition-colors ${
              isLast ? "bg-primary" : "bg-primary/25 hover:bg-primary/40"
            }`}
            // ⚠️ MINIMAL BALANDLIK 3px: nol qiymatli kun butunlay
            // yo'qolib, grafikda teshik ko'rinardi.
            style={{ height: `${Math.max(3, (value / max) * 100)}%` }}
            title={`${value}`}
          />
        );
      })}
    </div>
  );
};
