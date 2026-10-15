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
  Inbox,
  MapPinOff,
  MessageSquareWarning,
  Radio,
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
import { PageHeader } from "@/widgets/page-header/page-header";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

export default function DashboardPage() {
  const { user, can, isProvinceWide } = useSession();

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
        hint="Ma'muriyatga murojaat qiling — ular ruxsatlarni xodimlar bo'limida beradi."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Boshqaruv paneli"
        description={
          isProvinceWide
            ? "Butun viloyat bo'yicha hozirgi holat."
            : `${user?.districtId ? "Sizning tumaningiz" : "Hududingiz"} bo'yicha hozirgi holat.`
        }
      />

      {/* ── E'TIBOR TALAB QILADIGANLAR ──────────────────────── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {can("signals.view") ? (
          <StatTile
            label="Ko'rilmagan signallar"
            value={signalCounts.data?.new ?? "—"}
            icon={RadioIcon}
            tone={signalCounts.data?.new ? "warning" : "default"}
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
              href="/issues?overdue=true"
            />
          </>
        ) : null}

        {can("groups.view") ? (
          <StatTile
            label="MFY biriktirilmagan guruh"
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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Kuzatuv holati ─────────────────────────────────── */}
        {can("groups.view") ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kuzatuv holati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row
                label="Jami guruh"
                value={groupStats.data?.total ?? "—"}
              />
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

              {signalStatus.data?.lastRunAt ? (
                <p className="border-t pt-3 text-xs text-muted-foreground">
                  Oxirgi tahlil: {formatRelativeUz(signalStatus.data.lastRunAt)}
                </p>
              ) : null}

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/groups">Guruhlarni ko&apos;rish</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* ── Murojaatlar holati ─────────────────────────────── */}
        {can("issues.view") ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Murojaatlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Yangi" value={issueStats.data?.new ?? "—"} />
              <Row
                label="Ko'rib chiqilmoqda"
                value={issueStats.data?.in_progress ?? "—"}
              />
              <Row label="Hal qilindi" value={issueStats.data?.resolved ?? "—"} />
              <Row label="Rad etildi" value={issueStats.data?.rejected ?? "—"} />

              {issueStats.data?.unassignedMahalla ? (
                <p className="border-t pt-3 text-xs text-amber-600 dark:text-amber-400">
                  {issueStats.data.unassignedMahalla} ta murojaatda hudud
                  belgilanmagan
                </p>
              ) : null}

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/issues">Murojaatlarni ko&apos;rish</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* ── Oxirgi 14 kun ──────────────────────────────────── */}
        {can("reports.view") ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Oxirgi 14 kun</CardTitle>
            </CardHeader>
            <CardContent>
              {daily.data && daily.data.length > 0 ? (
                <Sparkline points={daily.data.map((point) => point.total)} />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Ma&apos;lumot yo&apos;q
                </p>
              )}

              <div className="mt-3 space-y-2 text-sm">
                <Row
                  label="Jami murojaat"
                  value={
                    daily.data?.reduce((sum, point) => sum + point.total, 0) ?? "—"
                  }
                />
                <Row
                  label="Hal qilingan"
                  value={
                    daily.data?.reduce((sum, point) => sum + point.resolved, 0) ?? "—"
                  }
                />
              </div>

              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/reports">Batafsil hisobot</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}

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
    <p className="tabular font-medium">{value}</p>
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
    <div className="flex h-20 items-end gap-1">
      {points.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-sm bg-primary/70"
          // ⚠️ MINIMAL BALANDLIK 2px: nol qiymatli kun butunlay
          // yo'qolib, grafikda teshik ko'rinardi.
          style={{ height: `${Math.max(2, (value / max) * 100)}%` }}
          title={`${value}`}
        />
      ))}
    </div>
  );
};
