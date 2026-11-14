"use client";

/**
 * QAMROV — BOT QAYSI MFY LARGA KIRGAN, QAYSILARIGA KIRMAGAN.
 *
 * ── NIMA UCHUN ALOHIDA SAHIFA ─────────────────────────────────────────
 *
 * ⚠️ PANELDA FAQAT TESKARI YO'NALISH BOR EDI: "MFY si yo'q guruhlar"
 * (Guruhlar sahifasidagi filtr). Bu BOSHQA savol va u osonroq:
 * biriktirmani xodim bir bosishda tuzatadi.
 *
 * ⚠️ HAQIQIY BO'SHLIQ ESA TESKARISI: "guruhi yo'q MFY lar". Bunday
 * mahalla BUTUNLAY kuzatuvsiz va panelda bu HECH QANDAY raqam bilan
 * ko'rinmasdi — "Signallar: 0" degan ko'rsatkich "mahallada muammo
 * yo'q" degan xulosaga o'xshaydi, holbuki sabab bot u yerda yo'qligi.
 *
 * ── UCH USTUN, UCH BOSHQA CHORA ───────────────────────────────────────
 *
 *   bot guruhda YO'Q          → raisga murojaat qilib, botni qo'shish
 *   bot bor, ADMIN emas       → guruh egasiga admin huquqi so'rash
 *   admin, O'CHIRISH yo'q     → admin huquqlarini to'g'rilash
 *
 * ⚠️ BULAR BIR USTUNGA YIG'ILMAYDI: "qamrov 60%" degan yakka son
 * ma'muriyatga NIMA QILISHNI aytmasdi. Har holat boshqa odamga,
 * boshqa so'rov bilan boriladi.
 */

import { Download, FileSpreadsheet, Network } from "lucide-react";
import Link from "next/link";

import { useSession } from "@/entities/session/auth-provider";
import { useCoverageReport, useExportCoverage } from "@/features/coverage/api";
import { ApiError } from "@/shared/api/client";
import type { CoverageRow } from "@/shared/api/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  EmptyState,
  ErrorState,
  Spinner,
  TableSkeleton,
} from "@/shared/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { PageHeader } from "@/widgets/page-header/page-header";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

export default function CoveragePage() {
  const { can } = useSession();

  const coverage = useCoverageReport();
  const exportReport = useExportCoverage();

  const data = coverage.data;
  const canManageGroups = can("groups.view");

  /**
   * ⚠️ MFY SI YO'Q TUMANLAR JADVALDAN CHIQARILADI: reyestr hali
   * to'ldirilmagan tuman "qamrov 0%" bo'lib, eng yomon qatorda
   * turardi — holbuki unda hisoblanadigan narsa ham yo'q. Ularning
   * soni jadval ostida alohida aytiladi.
   */
  const rows = (data?.districts ?? []).filter((row) => row.mahallaTotal > 0);
  const emptyDistricts = (data?.districts ?? []).length - rows.length;

  /**
   * ⚠️ ENG YOMON QAMROV YUQORIDA: sahifaning butun ma'nosi —
   * "qayerda ish qoldi". Alifbo tartibi bilan tuzatish kerak bo'lgan
   * tuman o'rtada qolib ketardi.
   *
   * ⚠️ NUSXA OLINADI (`[...]`): `sort` massivni JOYIDA o'zgartiradi
   * va u TanStack Query keshidagi obyekt.
   */
  const sorted = [...rows].sort(
    (a, b) => (a.coverageRate ?? 101) - (b.coverageRate ?? 101),
  );

  return (
    <>
      <PageHeader
        title="Qamrov"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={exportReport.isPending || !data}
              onClick={() => exportReport.mutate("coverage")}
            >
              {exportReport.isPending ? (
                <Spinner className="mr-1.5 size-4" />
              ) : (
                <Download className="mr-1.5 size-4" />
              )}
              Qamrov (CSV)
            </Button>

            {/*
              ⚠️ TUGMA `groups.view` SIZ KO'RINMAYDI: ro'yxatda guruh
              nomlari va havolalari bor. Server ham 403 beradi, bu
              faqat qulaylik — ruxsati yo'q odamga ishlamaydigan
              tugma ko'rsatish "panel buzuq" degan taassurot
              berardi.
            */}
            {canManageGroups ? (
              <Button
                variant="outline"
                disabled={exportReport.isPending || !data?.unassignedGroups}
                onClick={() => exportReport.mutate("unassigned-groups")}
              >
                <FileSpreadsheet className="mr-1.5 size-4" />
                Biriktirilmagan guruhlar
              </Button>
            ) : null}
          </div>
        }
      />

      {coverage.isError ? (
        <ErrorState
          message={
            coverage.error instanceof ApiError ? coverage.error.message : undefined
          }
          onRetry={() => void coverage.refetch()}
        />
      ) : (
        <>
          {/* ── KO'RSATKICHLAR ──────────────────────────────── */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatTile
              label="Qamrov"
              value={
                data?.totals.coverageRate != null
                  ? `${data.totals.coverageRate}%`
                  : "—"
              }
              icon={Network}
              featured
              hint={
                data
                  ? `${data.totals.covered} / ${data.totals.mahallaTotal} MFY`
                  : undefined
              }
            />

            {/*
              ⚠️ "BOT YO'Q" ENG QIZIL PLITKA: bu mahallalardan
              umuman ma'lumot kelmayapti va boshqa hamma
              ko'rsatkich ularni hisobga olmaydi — ya'ni hisobot
              yaxshi ko'rinib, aholining bir qismi butunlay
              ko'rinmas bo'lib qolgan.
            */}
            <StatTile
              label="Botsiz MFY"
              value={data?.totals.notAttached ?? "—"}
              tone={data?.totals.notAttached ? "danger" : "success"}
              hint={
                data?.totals.notAttached
                  ? "Kuzatuvsiz — signal ham kelmaydi"
                  : "Hammasiga kirgan"
              }
            />

            <StatTile
              label="Admin emas"
              value={data?.totals.notAdmin ?? "—"}
              tone={data?.totals.notAdmin ? "warning" : "default"}
              hint="O'qiydi, lekin o'chira olmaydi"
            />

            <StatTile
              label="O'chirish huquqi yo'q"
              value={data?.totals.adminNoDelete ?? "—"}
              tone={data?.totals.adminNoDelete ? "warning" : "default"}
              hint="Admin, lekin qalqon ishlamaydi"
            />

            {/*
              ⚠️ BIRIKTIRILMAGAN GURUHLAR TUMAN JADVALIDA YO'Q va
              shu sababdan alohida plitkada: ular qaysi tumanga
              tegishli ekani NOMA'LUM — aynan shuning uchun
              biriktirilmagan. Jadvalga qo'shilsa, qamrov foizi
              noto'g'ri chiqardi.
            */}
            <StatTile
              label="Biriktirilmagan guruh"
              value={data?.unassignedGroups ?? "—"}
              tone={data?.unassignedGroups ? "warning" : "default"}
              hint="Qaysi MFY ga tegishli — noma'lum"
              href="/groups?unassigned=true"
            />
          </div>

          {/* ── TUMANLAR ────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tumanlar bo&apos;yicha</CardTitle>
              {/*
                ⚠️ UCH USTUNNING MA'NOSI YOZILADI: ularsiz xodim
                "Admin emas" va "O'chirish huquqi yo'q" ni bir xil
                narsa deb o'qib, ikkinchisini e'tiborsiz
                qoldirardi — holbuki chora boshqa.
              */}
              <p className="text-xs text-muted-foreground">
                <strong>Botsiz</strong> — raisga murojaat qilib botni
                qo&apos;shish kerak. <strong>Admin emas</strong> — guruh
                egasidan admin huquqi so&apos;rash.{" "}
                <strong>O&apos;chirish huquqi yo&apos;q</strong> — admin, lekin
                &laquo;Xabarlarni o&apos;chirish&raquo; belgisi yoqilmagan.
              </p>
            </CardHeader>

            <CardContent className="p-0">
              {coverage.isLoading ? (
                <TableSkeleton rows={8} cols={6} />
              ) : sorted.length === 0 ? (
                <EmptyState
                  icon={Network}
                  title="MFY kiritilmagan"
                  hint="Avval Hudud bo'limida tuman va MFY larni kiriting — qamrov shundan keyin hisoblanadi."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tuman</TableHead>
                      <TableHead className="text-right">MFY</TableHead>
                      <TableHead className="text-right">Bot bor</TableHead>
                      <TableHead className="text-right">Botsiz</TableHead>
                      <TableHead className="text-right">Admin emas</TableHead>
                      <TableHead className="text-right">
                        O&apos;chirish yo&apos;q
                      </TableHead>
                      <TableHead className="text-right">Qamrov</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sorted.map((row) => (
                      <CoverageTableRow key={row.districtId} row={row} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/*
            ⚠️ CHIQARILGAN TUMANLAR SONI AYTILADI: usiz xodim
            jadvalda 15 tuman kutib, 1 tasini ko'rib, "hisobot
            buzuq" deb o'ylardi.
          */}
          {emptyDistricts > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {emptyDistricts} ta tumanda MFY kiritilmagan — jadvalga
              qo&apos;shilmadi.{" "}
              <Link href="/territory" className="underline">
                Hudud bo&apos;limi
              </Link>
            </p>
          ) : null}
        </>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  TUMAN QATORI
// ═══════════════════════════════════════════════════════════════════

const CoverageTableRow = ({ row }: { row: CoverageRow }) => (
  <TableRow>
    <TableCell className="text-sm font-medium">
      {/*
        ⚠️ TUMAN NOMI HUDUD BO'LIMIGA HAVOLA: xodim qatorni ko'rib,
        darhol o'sha tumanning MFY larini ochishi kerak — qaysi
        biri botsiz ekanini ko'rish uchun. Usiz u menyuga qaytib,
        filtrni qo'lda tanlardi.
      */}
      <Link href="/territory" className="hover:text-primary">
        {row.districtName}
      </Link>
    </TableCell>

    <TableCell className="tabular text-right text-sm text-muted-foreground">
      {row.mahallaTotal}
    </TableCell>

    <TableCell className="tabular text-right text-sm">{row.covered}</TableCell>

    <TableCell className="tabular text-right text-sm">
      {row.notAttached > 0 ? (
        <span className="font-medium text-destructive">{row.notAttached}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </TableCell>

    <TableCell className="tabular text-right text-sm">
      {row.notAdmin > 0 ? (
        <span className="font-medium text-amber-600 dark:text-amber-500">
          {row.notAdmin}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </TableCell>

    <TableCell className="tabular text-right text-sm">
      {row.adminNoDelete > 0 ? (
        <span className="font-medium text-amber-600 dark:text-amber-500">
          {row.adminNoDelete}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </TableCell>

    <TableCell className="text-right">
      {/*
        ⚠️ FOIZ RANGLI YORLIQDA: jadvalda 15 qator bor va yakka son
        bo'yicha "qaysi tuman yomon" ni ajratish ko'z bilan skanerlash
        bo'lardi.

        ⚠️ CHEGARALAR QAT'IY: 100% — yashil, 50% dan past — qizil.
        Oraliq sariq. Uzluksiz gradient bo'lsa, 70% va 75% farqi
        ko'rinmasdi.
      */}
      {row.coverageRate == null ? (
        <span className="text-sm text-muted-foreground">—</span>
      ) : (
        <Badge className={rateClass(row.coverageRate)}>{row.coverageRate}%</Badge>
      )}
    </TableCell>
  </TableRow>
);

const rateClass = (rate: number): string => {
  if (rate >= 100) {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200";
  }

  if (rate < 50) {
    return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200";
  }

  return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200";
};
