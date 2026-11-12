"use client";

/**
 * HISOBOTLAR.
 *
 * ⚠️ BARCHA KESIMLAR AYNI FILTRNI OLADI va server tomonida ham
 * bitta `baseWhere()` ustiga quriladi. Shuning uchun "jami" raqam
 * har tabda BIR XIL bo'ladi. Filtrni har kesim uchun alohida
 * yuborsak, ikki tab ikki xil raqam ko'rsatardi — va o'shanda
 * hisobotga ishonch qolmasdi.
 *
 * ⚠️ `attachRate` — AI ANIQLIGINING O'LCHOVI: biriktirilgan /
 * ko'rilgan. Hali ko'rilmagan signal maxrajda EMAS (u AI to'g'ri
 * yoki xato topganini bildirmaydi).
 */

import { useTheme } from "next-themes";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FileSpreadsheet, Repeat } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useCategoryReport,
  useDailyReport,
  useMobileReport,
  useExportReport,
  useRecurringReport,
  useReportOverview,
  useSignalReport,
  useTerritoryReport,
  type ReportFilters,
} from "@/features/reports/api";
import { useDistricts } from "@/features/territory/api";
import { chartColors, chartTooltipStyle } from "@/shared/config/chart-colors";
import { formatDateUz, formatDateTimeUz, daysAgoInput, toInputDate } from "@/shared/lib/date";
import { formatPeople } from "@/shared/config/labels";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input, Label } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CardSkeleton, EmptyState, Spinner } from "@/shared/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ReportAssistant } from "@/features/reports/assistant";
import { PageHeader } from "@/widgets/page-header/page-header";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

const ALL = "__all__";

const VALID_TABS = [
  "dynamics",
  "territory",
  "recurring",
  "categories",
  "ai",
  "mobile",
];

/**
 * EKSPORT KESIMLARI — TAB BILAN MOS.
 *
 * ⚠️ FAOL TAB BO'YICHA TANLANADI: rahbariyat ekranda
 * ko'rayotgan kesimni yuklab olishni kutadi. Bitta umumiy
 * "Yuklab olish" tugmasi har doim bir xil fayl berib,
 * "men hudud kesimini so'ragandim" degan savolga olib
 * kelardi.
 *
 * ⚠️ TABDA MOS KESIM BO'LMASA — UMUMIY: "AI samarasi" va
 * "Ilova" tablari uchun alohida CSV yozilmadi, chunki
 * ularning raqamlari bir nechta (jami, foiz) va jadval
 * shakliga tushmaydi.
 */
const EXPORT_KIND: Record<string, string> = {
  dynamics: "overview",
  territory: "territory",
  recurring: "recurring",
  categories: "categories",
};

export default function ReportsPage() {
  // ⚠️ BOSHLANG'ICH TAB URL'DAN: dashboard "Analitika" havolasi
  // `/reports?tab=mobile` beradi va foydalanuvchi o'sha tabni
  // ko'rishi kerak.
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const defaultTab = initialTab && VALID_TABS.includes(initialTab) ? initialTab : "dynamics";

  /**
   * ⚠️ `resolvedTheme`, `theme` EMAS: `theme` "system" bo'lishi
   * mumkin va o'shanda qaysi rang kerakligi noma'lum qolardi.
   *
   * ⚠️ SERVERDA `undefined` — shuning uchun standart YORUG'.
   * Aks holda birinchi render'da tungi ranglar chizilib, keyin
   * yorug'iga almashardi ("miltillash").
   */
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  // ⚠️ RANG VA TOOLTIP — `shared/config/chart-colors.ts` DAN:
  // boshqaruv paneli ham AYNI ro'yxatni ishlatadi va nusxa
  // bo'lsa ikki sahifada bir toifa boshqa rangda chiqardi.
  const palette = chartColors(isDark);
  const tooltipStyle = chartTooltipStyle(isDark);

  const [filters, setFilters] = useState<ReportFilters>({
    // ⚠️ STANDART OYNA — 30 KUN: butun tarix bo'yicha hisobot
    // birinchi ochilishda sekin bo'lardi va "bu oy nima bo'ldi"
    // degan eng ko'p so'raladigan savolga javob bermasdi.
    from: daysAgoInput(30),
    to: toInputDate(new Date()),
  });

  const [days, setDays] = useState(30);

  /**
   * ⚠️ FAOL TAB HOLATDA SAQLANADI: `Tabs` o'zi boshqaradi, lekin
   * EKSPORT tugmasi tabdan TASHQARIDA (sarlavhada) turadi va
   * qaysi kesim ko'rinayotganini bilishi kerak.
   */
  const [tab, setTab] = useState(defaultTab);

  const districts = useDistricts();
  const overview = useReportOverview(filters);
  const territory = useTerritoryReport(filters);
  const categories = useCategoryReport(filters);
  const signals = useSignalReport(filters);
  const mobile = useMobileReport(filters);
  const daily = useDailyReport(days);
  const recurring = useRecurringReport(filters);
  const exportReport = useExportReport();

  const patch = (next: Partial<ReportFilters>) =>
    setFilters((prev) => ({ ...prev, ...next }));

  return (
    <>
      <PageHeader
        title="Hisobotlar"
        actions={
          <div className="flex gap-2">
            <ReportAssistant filters={filters} />

            {EXPORT_KIND[tab] ? (
              <Button
                variant="outline"
                disabled={exportReport.isPending}
                onClick={() =>
                  exportReport.mutate({ kind: EXPORT_KIND[tab] as string, filters })
                }
              >
                {exportReport.isPending ? (
                  <Spinner className="mr-1.5 size-4" />
                ) : (
                  <Download className="mr-1.5 size-4" />
                )}
                Yuklab olish
              </Button>
            ) : null}

            {/*
              ⚠️ XOM MA'LUMOT ALOHIDA TUGMA: kesim — xulosa uchun,
              xom ro'yxat esa TEKSHIRISH uchun ("bu 450 ta
              murojaat qaysilar?"). Ikkisini bitta tugmaga
              sig'dirib bo'lmaydi.
            */}
            <Button
              variant="outline"
              disabled={exportReport.isPending}
              onClick={() => exportReport.mutate({ kind: "issues", filters })}
            >
              <FileSpreadsheet className="mr-1.5 size-4" />
              Murojaatlar (CSV)
            </Button>
          </div>
        }
      />

      {/* ── Filtrlar ─────────────────────────────────────────── */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="from">Boshlanish</Label>
          <Input
            id="from"
            type="date"
            value={filters.from ?? ""}
            onChange={(event) => patch({ from: event.target.value || undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="to">Tugash</Label>
          <Input
            id="to"
            type="date"
            value={filters.to ?? ""}
            onChange={(event) => patch({ to: event.target.value || undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Tuman</Label>
          <Select
            value={filters.districtId ?? ALL}
            onValueChange={(value) =>
              patch({ districtId: value === ALL ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Barcha tumanlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barcha tumanlar</SelectItem>
              {districts.data?.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setFilters({ from: daysAgoInput(7), to: toInputDate(new Date()) })
            }
          >
            7 kun
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setFilters({ from: daysAgoInput(30), to: toInputDate(new Date()) })
            }
          >
            30 kun
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setFilters({ from: daysAgoInput(90), to: toInputDate(new Date()) })
            }
          >
            90 kun
          </Button>
        </div>
      </div>

      {/* ── Umumiy ko'rsatkichlar ────────────────────────────── */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Jami murojaat" value={overview.data?.total ?? "—"} />
        <StatTile
          label="Hal qilish ulushi"
          value={
            overview.data?.resolutionRate != null
              ? `${overview.data.resolutionRate}%`
              : "—"
          }
          // ⚠️ IZOH MAXRAJNI AYTADI: "rad etilgan" maxrajda, lekin
          // suratda emas — aks holda hammasini rad etib 100%
          // ko'rsatish mumkin bo'lardi.
          hint="Rad etilganlar maxrajda"
          tone="success"
        />
        <StatTile
          label="O'rtacha hal qilish"
          value={
            overview.data?.avgResolutionHours != null
              ? `${overview.data.avgResolutionHours} soat`
              : "—"
          }
          hint="Faqat yopilganlar bo'yicha"
        />
        <StatTile
          label="Muddati o'tgan"
          value={overview.data?.overdue ?? "—"}
          tone={overview.data?.overdue ? "danger" : "default"}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="dynamics">Dinamika</TabsTrigger>
          <TabsTrigger value="territory">Hudud</TabsTrigger>
          <TabsTrigger value="recurring">Tizimli muammolar</TabsTrigger>
          <TabsTrigger value="categories">Yo&apos;nalishlar</TabsTrigger>
          <TabsTrigger value="ai">AI samarasi</TabsTrigger>
          <TabsTrigger value="mobile">Ilova</TabsTrigger>
        </TabsList>

        {/* ══ DINAMIKA ═════════════════════════════════════════ */}
        <TabsContent value="dynamics">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">Kunlik murojaatlar</CardTitle>
              <Select
                value={String(days)}
                onValueChange={(value) => setDays(Number.parseInt(value, 10))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 kun</SelectItem>
                  <SelectItem value="30">30 kun</SelectItem>
                  <SelectItem value="90">90 kun</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>

            <CardContent>
              {daily.isLoading ? (
                <CardSkeleton count={1} />
              ) : (daily.data?.length ?? 0) === 0 ? (
                <EmptyState title="Ma'lumot yo'q" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={daily.data}>
                    {/* ⚠️ `vertical={false}`: vertikal to'rlar
                        ko'rsatkichni o'qishga yordam bermaydi,
                        faqat shovqin qo'shadi. */}
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      // ⚠️ SANA QISQARTIRILADI ("21-may"): to'liq
                      // format ("21-may, 2025") 30 ta nuqtada
                      // o'qa ustida bir-biriga urilib ketardi.
                      tickFormatter={(value: string) =>
                        formatDateUz(value).replace(/,.*$/, "")
                      }
                      fontSize={11}
                      tickMargin={8}
                    />
                    <YAxis fontSize={11} allowDecimals={false} width={32} />
                    <Tooltip
                      // ⚠️ `label` TURI `ReactNode` (recharts shunday
                      // e'lon qiladi), `string` emas. `formatDateUz`
                      // yaroqsiz qiymatda "—" qaytaradi, shuning
                      // uchun qo'shimcha tekshiruv kerak emas.
                      labelFormatter={(label) => formatDateUz(label as string)}
                      contentStyle={tooltipStyle}
                      // ⚠️ SARLAVHA RANGI ALOHIDA: recharts uni
                      // `contentStyle` dan OLMAYDI va tunda o'zining
                      // och kulrangida qolib, o'qilmasdi.
                      labelStyle={{ color: tooltipStyle.color, fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {/*
                      ⚠️ "HAL QILINGAN" — BREND YASHILI (slot 0):
                      panelning qolgan joyida yashil aynan shu
                      ma'noni tashiydi. Teskari bog'lansa, bitta
                      ekranda yashil ikki xil narsani bildirardi.
                    */}
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Kelgan"
                      stroke={palette[2]}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      name="Hal qilingan"
                      stroke={palette[0]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ HUDUD ════════════════════════════════════════════ */}
        <TabsContent value="territory">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tumanlar bo&apos;yicha</CardTitle>
              </CardHeader>
              <CardContent>
                {(territory.data?.districts.length ?? 0) === 0 ? (
                  <EmptyState title="Ma'lumot yo'q" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={territory.data?.districts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={11} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        fontSize={11}
                        width={110}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Murojaat" radius={[0, 4, 4, 0]}>
                        {territory.data?.districts.map((_, index) => (
                          <Cell
                            key={index}
                            fill={palette[index % palette.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/*
                  ⚠️ MUTLAQ SON TUMANLARNI SOLISHTIRISHGA YARAMAYDI:
                  "Asakada 450, Ulug'norda 50" degan diagramma
                  Asakani eng yomon ko'rsatadi — holbuki unda
                  aholi ham o'n barobar ko'p. Shuning uchun
                  diagramma OSTIDA nisbiy ko'rsatkich turadi.

                  ⚠️ DIAGRAMMAGA QO'SHILMADI: ikki o'lchov bitta
                  o'qda chizilsa (450 va 18), nisbiy ustunlar
                  ko'rinmas chiziqqa aylanardi.
                */}
                {(territory.data?.districts.length ?? 0) > 0 ? (
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tuman</TableHead>
                        <TableHead className="text-right">Murojaat</TableHead>
                        <TableHead className="text-right">Aholi</TableHead>
                        <TableHead className="text-right">1000 kishiga</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...(territory.data?.districts ?? [])]
                        /*
                          ⚠️ NISBIY KO'RSATKICH BO'YICHA TARTIBLANADI,
                          mutlaq son bo'yicha emas: jadvalning
                          ma'nosi aynan shunda — "kimda haqiqatdan
                          yomon".

                          ⚠️ NUSXA OLINADI (`[...]`): `sort` massivni
                          JOYIDA o'zgartiradi va u TanStack Query
                          keshidagi obyekt — diagramma tartibi ham
                          o'zgarib ketardi.
                        */
                        .sort((a, b) => (b.per1000 ?? -1) - (a.per1000 ?? -1))
                        .map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-sm">{row.name}</TableCell>
                            <TableCell className="tabular text-right text-sm">
                              {row.count}
                            </TableCell>
                            <TableCell className="tabular text-right text-sm text-muted-foreground">
                              {row.population ? (
                                <>
                                  {formatPeople(row.population)}
                                  {/*
                                    ⚠️ MANBA KO'RSATILADI: MFY lardan
                                    yig'ilgan son to'liq bo'lmasligi
                                    mumkin va o'shanda nisbiy
                                    ko'rsatkich sun'iy ravishda KATTA
                                    chiqadi.
                                  */}
                                  {row.populationSource === "mahallas" ? (
                                    <span
                                      className="ml-1 text-amber-600 dark:text-amber-500"
                                      title="MFY lardan yig'ilgan — to'liq bo'lmasligi mumkin"
                                    >
                                      *
                                    </span>
                                  ) : null}
                                </>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="tabular text-right text-sm font-medium">
                              {/*
                                ⚠️ AHOLI YO'Q BO'LSA "—", NOL EMAS:
                                nol "muammo yo'q" degan noto'g'ri
                                xulosa berardi.
                              */}
                              {row.per1000 ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : null}

                {/*
                  ⚠️ AHOLI TO'LDIRILMAGANI ALOHIDA AYTILADI: usiz
                  ustun bo'sh turardi va xodim "hisobot buzuq" deb
                  o'ylardi. Qayerda to'ldirish kerakligi ham
                  ko'rsatiladi.
                */}
                {(territory.data?.districts ?? []).some(
                  (row) => row.per1000 === null,
                ) ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Ba&apos;zi tumanlarda aholi soni kiritilmagan — nisbiy
                    ko&apos;rsatkich hisoblanmadi. Hudud bo&apos;limida
                    to&apos;ldiriladi.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">MFY bo&apos;yicha</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(territory.data?.mahallas.length ?? 0) === 0 ? (
                  <EmptyState title="Ma'lumot yo'q" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>MFY</TableHead>
                        <TableHead className="text-right">Murojaat</TableHead>
                        <TableHead className="text-right">1000 aholiga</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {territory.data?.mahallas.slice(0, 15).map((row) => (
                        <TableRow key={row.mahallaId ?? "none"}>
                          <TableCell className="text-sm">
                            <p
                              className={
                                // ⚠️ HUDUDI YO'Q SATR AJRATILADI:
                                // uning soni "MFY biriktirish ishi
                                // qoldi" degan signalning o'zi.
                                row.mahallaId
                                  ? undefined
                                  : "text-amber-600 dark:text-amber-400"
                              }
                            >
                              {row.mahallaName}
                            </p>
                            {row.district ? (
                              <p className="text-xs text-muted-foreground">
                                {row.district.name}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="tabular text-right">
                            {row.count}
                          </TableCell>
                          <TableCell className="tabular text-right text-muted-foreground">
                            {/* ⚠️ `population` YO'Q BO'LSA "—":
                                nol ko'rsatilsa "muammo yo'q" degan
                                noto'g'ri xulosa chiqardi. */}
                            {row.per1000 ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══ YO'NALISHLAR ═════════════════════════════════════ */}
        {/* ══ TIZIMLI MUAMMOLAR ══════════════════════════ */}
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Qayta-qayta takrorlanadigan muammolar
              </CardTitle>
              {/*
                ⚠️ KESIMNING MA'NOSI YOZILADI: "Kommunal xizmatlar
                — 400 ta" degan qator hech narsa aytmaydi, "Turon
                MFY, Ichimlik suvi — 3 oyda 14 marta" esa ANIQ ish
                buyurtmasi. Xodim buni tushunmasa, jadvalni oddiy
                reyting deb o'qib ketardi.
              */}
              <p className="text-xs text-muted-foreground">
                Ayni MFY da, ayni yo&apos;nalishda 3 martadan ko&apos;p
                qaytgan muammolar. Bu quvurni yamash emas,
                ALMASHTIRISH kerakligini ko&apos;rsatadi.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {recurring.isLoading ? (
                <CardSkeleton count={1} />
              ) : (recurring.data?.items.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Repeat}
                  title="Takrorlanadigan muammo topilmadi"
                  hint="Tanlangan davrda ayni MFY va yo'nalish bo'yicha 3 martadan ko'p murojaat kelmagan."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MFY</TableHead>
                      <TableHead>Yo&apos;nalish</TableHead>
                      <TableHead className="text-right">Hodisa</TableHead>
                      <TableHead className="text-right">Jami</TableHead>
                      <TableHead className="text-right">Oyiga</TableHead>
                      <TableHead>Oxirgi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurring.data?.items.map((row) => (
                      <TableRow key={`${row.mahallaId}-${row.categoryId}`}>
                        <TableCell className="text-sm">
                          <p>{row.mahallaName}</p>
                          {row.district ? (
                            <p className="text-xs text-muted-foreground">
                              {row.district.name}
                            </p>
                          ) : null}
                        </TableCell>

                        <TableCell className="text-sm">
                          {/*
                            ⚠️ OTA YO'NALISH HAM KO'RSATILADI: yakka
                            "Ichimlik suvi" kontekstsiz qolardi va
                            uni "Tozalik" bilan adashtirish mumkin
                            edi (AI promptidagi ayni sabab).
                          */}
                          {row.parentName ? (
                            <p className="text-xs text-muted-foreground">
                              {row.parentName}
                            </p>
                          ) : null}
                          <p>{row.categoryName}</p>
                        </TableCell>

                        <TableCell className="tabular text-right text-sm font-medium">
                          {row.incidents}
                        </TableCell>

                        <TableCell className="tabular text-right text-sm text-muted-foreground">
                          {/*
                            ⚠️ JAMI VA HODISA ALOHIDA USTUN: bitta
                            transformator uzilishi 20 ta murojaat
                            bo'lishi mumkin va "20 marta muammo
                            bo'ldi" degan xulosa XATO bo'lardi.
                          */}
                          {row.total}
                          {row.duplicates > 0 ? (
                            <span className="ml-1 text-xs">
                              ({row.duplicates} takroriy)
                            </span>
                          ) : null}
                        </TableCell>

                        <TableCell className="tabular text-right text-sm">
                          {row.perMonth}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {row.lastAt ? formatDateTimeUz(row.lastAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Yo&apos;nalishlar bo&apos;yicha taqsimot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(categories.data?.length ?? 0) === 0 ? (
                <EmptyState title="Ma'lumot yo'q" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categories.data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={150} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Murojaat" radius={[0, 4, 4, 0]}>
                      {categories.data?.map((row, index) => (
                        <Cell
                          key={row.categoryId}
                          // ⚠️ KATEGORIYANING O'Z RANGI ustun
                          // turadi: panelda u hamma joyda shu rang
                          // bilan ko'rinadi va diagramma boshqa
                          // rang bersa, bog'lash qiyin bo'lardi.
                          fill={row.color ?? palette[index % palette.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/*
                ⚠️ MUDDAT USTUNI DIAGRAMMAGA QO'SHILMADI, OSTIDA
                JADVAL: ikki ustun yonma-yon chizilsa, "jami 400"
                yonida "muddati o'tgan 12" ko'rinmas chiziqqa
                aylanardi — holbuki MUHIM son aynan ikkinchisi.

                ⚠️ JAMI YOLG'IZ HECH NARSA AYTMAYDI: "400 ta
                murojaat" yo'nalish yomon ishlayotganini
                bildirmaydi, "400 tadan 120 tasi muddatdan
                o'tgan" esa bildiradi.
              */}
              {(categories.data ?? []).some((row) => row.overdue > 0) ? (
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Yo&apos;nalish</TableHead>
                      <TableHead className="text-right">Murojaat</TableHead>
                      <TableHead className="text-right">Muddati o&apos;tgan</TableHead>
                      <TableHead className="text-right">Ulushi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(categories.data ?? [])]
                      /*
                        ⚠️ MUDDAT BUZILISHI BO'YICHA TARTIBLANADI,
                        jami bo'yicha emas: jadvalning ma'nosi
                        aynan shunda — "qayerda ish qolib
                        ketyapti". Nusxa olinadi (`[...]`), chunki
                        `sort` massivni JOYIDA o'zgartiradi va u
                        TanStack Query keshidagi obyekt
                        (diagramma tartibi ham o'zgarib ketardi).
                      */
                      .sort((a, b) => b.overdue - a.overdue)
                      .filter((row) => row.overdue > 0)
                      .map((row) => (
                        <TableRow key={row.categoryId}>
                          <TableCell className="text-sm">
                            {row.parentName ? (
                              <p className="text-xs text-muted-foreground">
                                {row.parentName}
                              </p>
                            ) : null}
                            <p>{row.name}</p>
                          </TableCell>
                          <TableCell className="tabular text-right text-sm text-muted-foreground">
                            {row.count}
                          </TableCell>
                          <TableCell className="tabular text-right text-sm font-medium text-destructive">
                            {row.overdue}
                          </TableCell>
                          <TableCell className="tabular text-right text-sm">
                            {/*
                              ⚠️ ULUSH HAM KO'RSATILADI: 12/400 va
                              12/20 — ikki butunlay boshqa holat,
                              lekin mutlaq son ikkisini bir xil
                              ko'rsatardi.
                            */}
                            {Math.round((row.overdue / row.count) * 100)}%
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ AI SAMARASI ══════════════════════════════════════ */}
        <TabsContent value="ai">
          <div className="grid gap-4 lg:grid-cols-3">
            <StatTile
              label="AI aniqligi"
              value={
                signals.data?.attachRate != null ? `${signals.data.attachRate}%` : "—"
              }
              hint="Ko'rilgan signallardan nechtasi muammoga aylandi"
              tone="success"
            />
            <StatTile label="Jami signal" value={signals.data?.total ?? "—"} />
            <StatTile
              label="Ko'rilmagan"
              value={signals.data?.status.new ?? "—"}
              tone={signals.data?.status.new ? "warning" : "default"}
            />

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm">Murojaatlar manbasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {/*
                  ⚠️ BU TABNING BUTUN MA'NOSI: "AI nechta muammo
                  topdi, odam nechta yubordi". Bu — AI'ning
                  foydasini o'lchashning yagona yo'li va
                  `Issue.source` ustuni aynan shu uchun muhrlanadi.
                */}
                <SourceRow
                  label="AI signalidan"
                  value={overview.data?.source.signal ?? 0}
                  total={overview.data?.total ?? 0}
                  color={palette[3]!}
                />
                <SourceRow
                  label="Botdan (xodim yubordi)"
                  value={overview.data?.source.bot ?? 0}
                  total={overview.data?.total ?? 0}
                  color={palette[5]!}
                />
                <SourceRow
                  label="Ilovadan (fuqaro)"
                  value={overview.data?.source.mobile ?? 0}
                  total={overview.data?.total ?? 0}
                  color={palette[1]!}
                />
                <SourceRow
                  label="Panelda qo'lda"
                  value={overview.data?.source.manual ?? 0}
                  total={overview.data?.total ?? 0}
                  // ⚠️ SLOT 6 — oxirgi mavjud rang. Palitra 7 ta
                  // (0–6): kattaroq indeks `undefined` berib,
                  // chiziq KO'RINMAY qolardi.
                  color={palette[6]!}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══ ILOVA (FUQARO MUROJAATLARI) ══════════════════════ */}
        <TabsContent value="mobile">
          <div className="grid gap-4 lg:grid-cols-4">
            <StatTile label="Jami (ilova)" value={mobile.data?.total ?? "—"} />
            <StatTile
              label="O'rtacha javob"
              value={
                mobile.data?.avgResponseHours != null
                  ? `${mobile.data.avgResponseHours} soat`
                  : "—"
              }
              hint="Fuqaroga javob berilgunicha"
            />
            <StatTile
              label="Muddatida bajarildi"
              value={mobile.data?.slaOnTimeRate != null ? `${mobile.data.slaOnTimeRate}%` : "—"}
              hint="Hal qilinganlar orasida SLA ichida"
              tone="success"
            />
            <StatTile
              label="Muddati o'tgan"
              value={mobile.data?.overdue ?? "—"}
              tone={mobile.data?.overdue ? "danger" : "default"}
            />

            {/* ── FUQAROLAR ───────────────────────────────────── */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Fuqarolar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <SourceRow
                  label="Faol (murojaat yuborgan)"
                  value={mobile.data?.citizens.active ?? 0}
                  total={mobile.data?.citizens.total ?? 0}
                  color={palette[0]!}
                />
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="text-muted-foreground">Ro&apos;yxatdan o&apos;tgan</span>
                  <span className="font-medium tabular-nums">
                    {mobile.data?.citizens.total ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bloklangan</span>
                  <span className="font-medium tabular-nums text-destructive">
                    {mobile.data?.citizens.blocked ?? "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* ── ENG FAOL FUQAROLAR ──────────────────────────── */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Eng faol fuqarolar</CardTitle>
              </CardHeader>
              <CardContent>
                {(mobile.data?.topCitizens.length ?? 0) === 0 ? (
                  <EmptyState title="Hali ma'lumot yo'q" />
                ) : (
                  <div className="space-y-2">
                    {mobile.data?.topCitizens.map((citizen, index) => (
                      <div
                        key={citizen.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                            {index + 1}
                          </span>
                          {citizen.name}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {citizen.appeals} murojaat · {citizen.points} ball
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── YO'NALISHLAR ────────────────────────────────── */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-sm">Ilovadagi yo&apos;nalishlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(mobile.data?.categories.length ?? 0) === 0 ? (
                  <EmptyState title="Hali ma'lumot yo'q" />
                ) : (
                  mobile.data?.categories.map((category, index) => (
                    <SourceRow
                      key={category.id}
                      label={category.name}
                      value={category.count}
                      total={mobile.data?.total ?? 0}
                      color={category.color ?? palette[index % 7]!}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

/** Manba ulushi — chiziq bilan. */
const SourceRow = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  // ⚠️ `total === 0` DA 0 GA BO'LISH: ulush 0 bo'ladi, `NaN` emas.
  const percent = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="tabular font-medium">
          {value} ({percent}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};
