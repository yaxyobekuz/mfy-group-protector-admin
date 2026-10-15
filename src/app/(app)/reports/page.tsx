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
  useReportOverview,
  useSignalReport,
  useTerritoryReport,
  type ReportFilters,
} from "@/features/reports/api";
import { useDistricts } from "@/features/territory/api";
import { formatDateUz, daysAgoInput, toInputDate } from "@/shared/lib/date";
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
import { CardSkeleton, EmptyState } from "@/shared/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { PageHeader } from "@/widgets/page-header/page-header";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

const ALL = "__all__";

/**
 * Diagramma ranglari.
 *
 * ⚠️ `labels.ts` DAGI HOLAT RANGLARIDAN ALOHIDA va bu ataylab:
 * bu yerda ranglar KATEGORIYALARNI ajratadi (ma'no tashimaydi),
 * holat ranglari esa ma'noli (qizil — e'tibor kerak). Ikkisini
 * aralashtirish "yashil kategoriya yaxshi" degan noto'g'ri
 * o'qishni tug'dirardi.
 */
/**
 * ⚠️ RANGLAR VALIDATORDAN O'TKAZILGAN, ko'z bilan tanlanmagan.
 * Har ikki rejim uchun tekshirildi: yorug'lik tasmasi, xroma
 * chegarasi, rang ko'rmaslikda (protan/deutan/tritan) ajralish va
 * fon bilan kontrast. Qiymatni O'ZGARTIRSANGIZ qayta tekshiring —
 * "chiroyliroq" ko'ringan rang ko'pincha daltonikda qo'shnisi
 * bilan qo'shilib ketadi.
 *
 * ⚠️ TUNGI RO'YXAT ALOHIDA TANLANGAN, yorug'ining "aylantirilgani"
 * EMAS: to'q fonda quyuq ranglar kontrast chegarasidan o'tmasdi.
 *
 * ⚠️ BIRINCHI SLOT — BREND YASHILI: diagrammada "hal qilingan"
 * chizig'i panelning qolgan qismidagi yashil bilan bir xil
 * ma'noni tashishi kerak.
 */
const CHART_COLORS_LIGHT = [
  "#1d7a4d",
  "#eb6834",
  "#2a78d6",
  "#eda100",
  "#c2185b",
  "#6250d6",
  "#00897b",
];

const CHART_COLORS_DARK = [
  "#2f9a66",
  "#d4653a",
  "#4a8ad8",
  "#e04f80",
  "#7d6ce0",
  "#b8881c",
  "#179c90",
];

export default function ReportsPage() {
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
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;

  /**
   * TOOLTIP USLUBI — BITTA JOYDA, uchala diagramma uchun.
   *
   * ⚠️ RECHARTS TOOLTIPNI `<body>` DAN TASHQARIDA emas, o'z inline
   * uslubi bilan chizadi va u mavzuni BILMAYDI: standart holda
   * oq fon qoladi. Tungi rejimda bu ko'zni qamashtirib, sarlavha
   * matni (och kulrang) oq fonda deyarli o'qilmasdi.
   */
  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 12,
    backgroundColor: isDark ? "#1c1c1c" : "#ffffff",
    border: `1px solid ${isDark ? "#2e2e2e" : "#e2e8e5"}`,
    color: isDark ? "#f5f5f5" : "#0f1a15",
    boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.25)",
  } as const;

  const [filters, setFilters] = useState<ReportFilters>({
    // ⚠️ STANDART OYNA — 30 KUN: butun tarix bo'yicha hisobot
    // birinchi ochilishda sekin bo'lardi va "bu oy nima bo'ldi"
    // degan eng ko'p so'raladigan savolga javob bermasdi.
    from: daysAgoInput(30),
    to: toInputDate(new Date()),
  });

  const [days, setDays] = useState(30);

  const districts = useDistricts();
  const overview = useReportOverview(filters);
  const territory = useTerritoryReport(filters);
  const categories = useCategoryReport(filters);
  const signals = useSignalReport(filters);
  const daily = useDailyReport(days);

  const patch = (next: Partial<ReportFilters>) =>
    setFilters((prev) => ({ ...prev, ...next }));

  return (
    <>
      <PageHeader
        title="Hisobotlar"
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

      <Tabs defaultValue="dynamics">
        <TabsList>
          <TabsTrigger value="dynamics">Dinamika</TabsTrigger>
          <TabsTrigger value="territory">Hudud</TabsTrigger>
          <TabsTrigger value="categories">Yo&apos;nalishlar</TabsTrigger>
          <TabsTrigger value="ai">AI samarasi</TabsTrigger>
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
                      stroke={chartColors[2]}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      name="Hal qilingan"
                      stroke={chartColors[0]}
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
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
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
                          fill={row.color ?? chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
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
                  color={chartColors[3]!}
                />
                <SourceRow
                  label="Botdan (xodim yubordi)"
                  value={overview.data?.source.bot ?? 0}
                  total={overview.data?.total ?? 0}
                  color={chartColors[5]!}
                />
                <SourceRow
                  label="Panelda qo'lda"
                  value={overview.data?.source.manual ?? 0}
                  total={overview.data?.total ?? 0}
                  // ⚠️ SLOT 6 — oxirgi mavjud rang. Palitra 7 ta
                  // (0–6): kattaroq indeks `undefined` berib,
                  // chiziq KO'RINMAY qolardi.
                  color={chartColors[6]!}
                />
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
