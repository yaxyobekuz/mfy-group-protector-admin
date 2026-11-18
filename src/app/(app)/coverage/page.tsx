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
 *
 * ── FAQAT KANAL BILAN QOPLANGAN MFY ──────────────────────────────────
 *
 * ⚠️ KANAL QAMROVNI BERADI: postlar o'qiladi, AI tahlil qiladi,
 * signal ham, muammo ham chiqadi. Lekin QALQON USTUNLARI unga
 * tegishli emas — kanalda zararli kontentni o'sha kanalning O'Z
 * admini yozadi, ya'ni o'chiriladigan begona xabar yo'q.
 *
 * ⚠️ SHUNING UCHUN "FAQAT KANAL" — ALOHIDA USTUN: u "admin emas" va
 * "o'chirish yo'q" ustunlarining MAXRAJINI tushuntiradi. Usiz
 * sonlar qo'shilmay qolgani xodimga xato bo'lib ko'rinardi, kanal
 * ham sanalsa esa panelda TUZATIB BO'LMAYDIGAN ogohlantirish
 * turardi (Telegram kanalda huquq bersa ham qalqon ishga tushmaydi).
 */

import { ChevronDown, ChevronRight, Download, FileSpreadsheet, Network } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useCoverageMahallas,
  useCoverageReport,
  useExportCoverage,
} from "@/features/coverage/api";
import { ApiError } from "@/shared/api/client";
import type { CoverageRow, MahallaCoverageRow } from "@/shared/api/types";
import { COVERAGE_GUARD_LABELS } from "@/shared/config/labels";
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

  /**
   * OCHIQ TUMANLAR.
   *
   * ⚠️ `Set`, BITTA `openId` EMAS (`territory` sahifasidagi ayni
   * qoida): xodim ikki tumanni yonma-yon solishtiradi va bittasini
   * ochganda ikkinchisi yopilib ketmasligi kerak.
   *
   * ⚠️ STANDART HOLDA YOPIQ: hammasi ochiq bo'lsa, sahifa yuzlab
   * qatorli ro'yxatga aylanib, tumanlar jadvalining o'zi ko'rinmay
   * ketardi — holbuki sahifaning asosiy ishi aynan o'sha jadval.
   */
  const [open, setOpen] = useState<Set<string>>(new Set());

  /**
   * ⚠️ RO'YXAT BIRINCHI OCHILISHDA YUKLANADI: sahifa ochilganda
   * emas. Ko'pchilik xodim faqat yig'ma jadvalga qaraydi va
   * yuzlab MFY ni har kirishda tortish bekorga kutish bo'lardi.
   */
  const mahallas = useCoverageMahallas(open.size > 0);

  /**
   * ⚠️ `districtId` BO'YICHA INDEKS, NOM BO'YICHA EMAS: nomda
   * apostrof va "tumani" so'zi har xil yozilishi mumkin
   * (`issue-map` dagi ayni sabab).
   */
  const byDistrict = useMemo(() => {
    const index = new Map<string, MahallaCoverageRow[]>();

    for (const group of mahallas.data ?? []) {
      for (const row of group.rows) {
        const bucket = index.get(row.districtId);
        if (bucket) bucket.push(row);
        else index.set(row.districtId, [row]);
      }
    }

    return index;
  }, [mahallas.data]);

  const toggle = (districtId: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(districtId)) next.delete(districtId);
      else next.add(districtId);
      return next;
    });
  };

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
              Qamrov (Excel)
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
                Biriktirilmaganlar
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

            {/*
              ⚠️ "FAQAT KANAL" QALQON PLITKALARIDAN OLDIN: u
              ikkisining maxrajini tushuntiradi. Rangi NEYTRAL —
              bu nosozlik emas, ongli holat.
            */}
            <StatTile
              label="Faqat kanal"
              value={data?.totals.channelOnly ?? "—"}
              hint="Kuzatuvda, qalqon tegishli emas"
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
              label="Biriktirilmagan chat"
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
                &laquo;Xabarlarni o&apos;chirish&raquo; belgisi yoqilmagan.{" "}
                <strong>Faqat kanal</strong> — kuzatuv ishlaydi, qalqon esa
                kanalga tegishli emas: hech narsa qilish kerak emas.
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
                      <TableHead className="text-right">Faqat kanal</TableHead>
                      <TableHead className="text-right">Admin emas</TableHead>
                      <TableHead className="text-right">
                        O&apos;chirish yo&apos;q
                      </TableHead>
                      <TableHead className="text-right">Qamrov</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sorted.map((row) => (
                      <CoverageTableRow
                        key={row.districtId}
                        row={row}
                        open={open.has(row.districtId)}
                        onToggle={() => toggle(row.districtId)}
                        mahallas={byDistrict.get(row.districtId)}
                        loading={mahallas.isLoading}
                      />
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

interface RowProps {
  row: CoverageRow;
  open: boolean;
  onToggle: () => void;
  /** Ochilganda ko'rsatiladigan MFY lar — hali yuklanmagan bo'lishi mumkin. */
  mahallas: MahallaCoverageRow[] | undefined;
  loading: boolean;
}

const CoverageTableRow = ({
  row,
  open,
  onToggle,
  mahallas,
  loading,
}: RowProps) => (
  <>
  <TableRow>
    <TableCell className="text-sm font-medium">
      {/*
        ⚠️ TUMAN NOMI — OCHISH TUGMASI, HAVOLA EMAS: avval u Hudud
        bo'limiga olib borardi va xodim u yerda filtrni qo'lda
        tanlab, qaysi MFY botsiz ekanini O'ZI izlardi. Endi javob
        shu yerda, qatorning ostida — sahifadan chiqmasdan.
      */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-left hover:text-primary"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        {row.districtName}
      </button>
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

    {/*
      ⚠️ RANGSIZ KO'RSATILADI: "faqat kanal" — nosozlik emas,
      ongli holat. Sariq bo'lsa, xodim uni tuzatilishi kerak deb
      o'ylab, kanalga bekorga admin huquqi so'rab yurardi.
    */}
    <TableCell className="tabular text-right text-sm text-muted-foreground">
      {row.channelOnly > 0 ? row.channelOnly : "—"}
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

    {/*
      ⚠️ ICHKI JADVAL BITTA HUJAYRAGA SIG'DIRILADI (`colSpan`):
      alohida ustunlar qo'shilsa, ular yuqoridagi yig'ma jadvalning
      ustunlari bilan surilib, ikkalasi ham o'qilmaydigan bo'lardi.
    */}
    {open ? (
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={8} className="p-0">
          <MahallaList rows={mahallas} loading={loading} />
        </TableCell>
      </TableRow>
    ) : null}
  </>
);

// ═══════════════════════════════════════════════════════════════════
//  MFY RO'YXATI — "QAYSI BIRI ULANDI"
// ═══════════════════════════════════════════════════════════════════

/**
 * ⚠️ ULANMAGANLARI YUQORIDA: ro'yxatning butun ma'nosi — "qaysi
 * mahallaga borish kerak". Alifbo tartibida ular 40 ta ulangan
 * qator orasiga tarqalib ketardi.
 */
const MahallaList = ({
  rows,
  loading,
}: {
  rows: MahallaCoverageRow[] | undefined;
  loading: boolean;
}) => {
  if (!rows) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
        {loading ? (
          <>
            <Spinner className="size-4" />
            Yuklanmoqda…
          </>
        ) : (
          "MFY topilmadi"
        )}
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => {
    if (a.connected !== b.connected) return a.connected ? 1 : -1;
    return a.mahallaName.localeCompare(b.mahallaName, "uz");
  });

  return (
    <div className="px-4 py-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>MFY</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead>Chatlar</TableHead>
            <TableHead>Qalqon</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {sorted.map((row) => (
            <TableRow key={`${row.districtId}-${row.mahallaName}`}>
              <TableCell className="text-sm font-medium">
                {row.mahallaName}
              </TableCell>

              <TableCell>
                {row.connected ? (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                    Ulangan
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200">
                    Ulanmagan
                  </Badge>
                )}
              </TableCell>

              {/*
                ⚠️ CHAT NOMI "ULANMAGAN" QATORDA HAM KO'RSATILADI va
                o'sha yerda u ENG kerakli: guruh reyestrda bor-u bot
                undan chiqarib yuborilganmi degan savolga javob shu
                yerda. Chora ikkisida boshqa — guruh ochish emas,
                botni qaytarish.
              */}
              <TableCell className="text-sm text-muted-foreground">
                {row.chats.length > 0 ? row.chats.join(", ") : "—"}
              </TableCell>

              <TableCell className="text-sm">
                {row.guard === null ? (
                  <span className="text-muted-foreground">—</span>
                ) : row.guard === "ok" ? (
                  <span className="text-muted-foreground">
                    {COVERAGE_GUARD_LABELS.ok}
                  </span>
                ) : (
                  <span className="font-medium text-amber-600 dark:text-amber-500">
                    {COVERAGE_GUARD_LABELS[row.guard]}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const rateClass = (rate: number): string => {
  if (rate >= 100) {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200";
  }

  if (rate < 50) {
    return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200";
  }

  return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200";
};
