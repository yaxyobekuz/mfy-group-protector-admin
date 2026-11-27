"use client";

/**
 * "ASOSIY" TAB — PLATFORMA BIR QARASHDA.
 *
 * ⚠️ AVVAL BU TAB JUDA KAM NARSA KO'RSATARDI: to'rtta plitka,
 * dinamika va auditoriya. Undan "tizim umuman qanday ishlayapti"
 * degan savolga javob olib bo'lmasdi — qamrov, xavfsizlik, xizmat
 * sifati va navbatdagi ishning yarmi boshqa sahifalarda qolib
 * ketardi va rahbar ularni ALOHIDA-ALOHIDA ochib yurardi.
 *
 * ── TARKIB TARTIBI — SAVOL KETMA-KETLIGI BO'YICHA ─────────────
 *
 *   1. Platforma holati   — "umuman qanday?"   (6 ta yirik raqam)
 *   2. E'tibor talab qiladi — "hozir nima qilish kerak?"
 *   3. Dinamika + holat   — "qayoqqa ketyapti?"
 *   4. Yo'nalishlar       — "nima ko'p?"
 *   5. Qamrov va kuzatuv  — "nimani KO'RMAYAPMIZ?"
 *   6. Xavfsizlik         — "aholi himoyalanganmi?"
 *   7. Auditoriya         — "kimga yetib boramiz?"
 *
 * ⚠️ 5-BAND ENG OSON UNUTILADI VA ENG MUHIMI: "signal 0" degan son
 * "mahallada muammo yo'q" degan xulosaga o'xshaydi, holbuki sabab
 * — bot u yerda YO'Q. Shuning uchun qamrov asosiy ekranga chiqdi.
 *
 * ⚠️ HAR BLOK O'Z RUXSATINI O'ZI TEKSHIRADI: hooklar ham shunga
 * qarab ishga tushadi, aks holda 403 qaytardi.
 *
 * ⚠️ PLITKALAR — HAVOLA: operator raqamni ko'rib, darhol ishga
 * kirishishi kerak. Havolasiz raqam "qiziqarli ko'rinish" bo'lib
 * qolardi.
 */

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Hourglass,
  MapPinOff,
  Megaphone,
  MessageSquareWarning,
  MessagesSquare,
  Network,
  Radio as RadioIcon,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

import { useSession } from "@/entities/session/auth-provider";
import { useCoverageReport } from "@/features/coverage/api";
import { useGroupStats } from "@/features/groups/api";
import { useIssueStats, useIssues } from "@/features/issues/api";
import { useSecurityStats } from "@/features/security/api";
import { useSignalCounts } from "@/features/signals/api";
import {
  useCategoryReport,
  useDailyReport,
  useMobileReport,
} from "@/features/reports/api";
import { formatPeople } from "@/shared/config/labels";
import { Button } from "@/shared/ui/button";
import { CategoryBars } from "@/widgets/dashboard/category-bars";
import { ChartFrame } from "@/widgets/dashboard/chart-frame";
import { Metric, MiniStat, NoData, StatRow } from "@/widgets/dashboard/parts";
import { StatusDonut } from "@/widgets/dashboard/status-donut";
import { TrendChart } from "@/widgets/dashboard/trend-chart";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

/** ⚠️ `limit: 1` — faqat `total` kerak, ro'yxatning o'zi emas. */
const COUNT_ONLY = { limit: 1 } as const;

export const OverviewTab = () => {
  const { can } = useSession();

  const issueStats = useIssueStats();
  const signalCounts = useSignalCounts();
  const groupStats = useGroupStats();

  // ⚠️ `/reports/*` — `reports.view` TALAB QILADI.
  const daily = useDailyReport(30);
  const mobile = useMobileReport({});
  const categories = useCategoryReport({});
  const coverage = useCoverageReport(can("reports.view"));

  const security = useSecurityStats(can("security.view"));

  const suspicious = useIssues({ ...COUNT_ONLY, suspicious: true });
  const duplicates = useIssues({ ...COUNT_ONLY, duplicates: true });

  /**
   * ⚠️ JAMI TO'RT HOLATDAN YIG'ILADI, serverdan alohida son
   * KELMAYDI: `IssueStats` da "jami" maydoni yo'q va uni qo'shish
   * uchun server o'zgartirilishi kerak bo'lardi. Yig'indi esa
   * AYNI ma'noni beradi — holatlar bir-birini istisno qiladi.
   */
  const stats = issueStats.data;
  const totalIssues = stats
    ? stats.new + stats.in_progress + stats.resolved + stats.rejected
    : null;

  const resolutionRate =
    stats && totalIssues && totalIssues > 0
      ? Math.round((stats.resolved / totalIssues) * 100)
      : null;

  const trend = daily.data?.reduce(
    (acc, point) => ({
      total: acc.total + point.total,
      resolved: acc.resolved + point.resolved,
    }),
    { total: 0, resolved: 0 },
  );

  /** ⚠️ NOLGA BO'LISHDAN HIMOYA: yangi o'rnatishda hamma son nol. */
  const guardTotal = security.data?.totalGroups ?? 0;

  return (
    <div className="grid auto-rows-min items-start gap-4 lg:grid-cols-6">
      {/*
        ══ 1. PLATFORMA HOLATI ═══════════════════════════════════

        ⚠️ OLTITA RAQAM, BITTA KARTADA: ular BIRGA o'qilganda ma'no
        beradi — "12 400 murojaat, 83% hal qilingan, 140 tasi
        kechikkan". Alohida plitkalarga bo'linsa, ularni ko'z bilan
        bog'lash kerak bo'lardi.

        ⚠️ ENG TEPADA VA ENG YIRIK: bu sahifaning javobi.
      */}
      {can("issues.view") ? (
        <ChartFrame
          title="Platforma holati"
          subtitle="Butun davr bo'yicha"
          className="lg:col-span-6"
        >
          <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Jami murojaat" value={totalIssues ?? "—"} />
            <Metric
              label="Hal qilingan"
              value={stats?.resolved ?? "—"}
              tone="primary"
            />
            <Metric
              label="Hal qilish ulushi"
              value={resolutionRate !== null ? `${resolutionRate}%` : "—"}
              tone="primary"
            />
            <Metric label="Ochiq" value={stats?.open ?? "—"} />
            <Metric
              label="Muddati o'tgan"
              value={stats?.overdue ?? "—"}
              tone={stats?.overdue ? "danger" : "default"}
            />
            {/*
              ⚠️ QAMROV SHU QATORDA: "12 400 murojaat" degan son
              qamrovsiz ALDAYDI — u faqat bot kirgan mahallalardan
              kelgan. 60% qamrovda esa haqiqiy hajm ikki barobar
              katta bo'lishi mumkin.
            */}
            {can("reports.view") ? (
              <Metric
                label="MFY qamrovi"
                value={
                  coverage.data?.totals.coverageRate !== null &&
                  coverage.data?.totals.coverageRate !== undefined
                    ? `${coverage.data.totals.coverageRate}%`
                    : "—"
                }
                tone={
                  (coverage.data?.totals.coverageRate ?? 100) < 80
                    ? "warning"
                    : "default"
                }
              />
            ) : null}
          </div>
        </ChartFrame>
      ) : null}

      {/* ══ 2. E'TIBOR TALAB QILADI ═══════════════════════════ */}
      {can("signals.view") ? (
        <div className="lg:col-span-3 xl:col-span-2">
          <StatTile
            label="Ko'rilmagan signallar"
            value={signalCounts.data?.new ?? "—"}
            icon={RadioIcon}
            featured
            hint={
              signalCounts.data?.highNew
                ? `${signalCounts.data.highNew} tasi yuqori jiddiylikda`
                : undefined
            }
            href="/signals"
          />
        </div>
      ) : null}

      {can("issues.view") ? (
        <>
          <div className="lg:col-span-3 xl:col-span-2">
            <StatTile
              label="Yangi murojaat"
              value={stats?.new ?? "—"}
              icon={MessageSquareWarning}
              href="/issues?status=new"
            />
          </div>

          <div className="lg:col-span-3 xl:col-span-1">
            <StatTile
              label="Ko'rib chiqilmoqda"
              value={stats?.in_progress ?? "—"}
              icon={Hourglass}
              href="/issues?status=in_progress"
            />
          </div>

          <div className="lg:col-span-3 xl:col-span-1">
            <StatTile
              label="Muddati o'tgan"
              value={stats?.overdue ?? "—"}
              icon={AlertTriangle}
              tone={stats?.overdue ? "danger" : "default"}
              href="/issues?overdue=true"
            />
          </div>
        </>
      ) : null}

      {/*
        ── HAL QILIB BO'LMAYDIGAN KESIMLAR ──────────────────────

        ⚠️ UCHALASI BOSHQA-BOSHQA CHORA TALAB QILADI, shuning uchun
        uchta alohida havola:
          hududsiz  → MFY biriktirish (tuman xodimi uni ko'rmaydi)
          shubhali  → o'qib ko'rish (matni mazmunsiz)
          takroriy  → bittasini hal qilish (javob hammasiga boradi)

        ⚠️ HAMMASI NOL BO'LSA KARTA KO'RINMAYDI: toza navbatda u
        panelni bekorga uzaytirardi.
      */}
      {can("issues.view") &&
      ((stats?.unassignedMahalla ?? 0) > 0 ||
        (suspicious.data?.total ?? 0) > 0 ||
        (duplicates.data?.total ?? 0) > 0 ||
        (groupStats.data?.unassigned ?? 0) > 0) ? (
        <ChartFrame title="Aralashuv kerak" className="lg:col-span-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats?.unassignedMahalla ? (
              <MiniStat
                icon={MapPinOff}
                label="Hudud belgilanmagan"
                value={stats.unassignedMahalla}
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
            {can("groups.view") && groupStats.data?.unassigned ? (
              <MiniStat
                icon={MessagesSquare}
                label="MFY biriktirilmagan chat"
                value={groupStats.data.unassigned}
                tone="warning"
                href="/groups?unassigned=true"
              />
            ) : null}
          </div>
        </ChartFrame>
      ) : null}

      {/* ══ 3. DINAMIKA + HOLAT ══════════════════════════════ */}
      {can("reports.view") ? (
        <ChartFrame
          title="Murojaat oqimi"
          subtitle="Oxirgi 30 kun"
          className="lg:col-span-6 xl:col-span-4"
        >
          <div className="mb-4 flex flex-wrap gap-8">
            <Metric label="Kelgan" value={trend?.total ?? "—"} />
            <Metric label="Hal qilingan" value={trend?.resolved ?? "—"} tone="primary" />
            <Metric
              label="Kunlik o'rtacha"
              value={
                trend && daily.data?.length
                  ? Math.round(trend.total / daily.data.length)
                  : "—"
              }
            />
          </div>

          {daily.data && daily.data.length > 0 ? (
            <TrendChart data={daily.data} />
          ) : (
            <NoData />
          )}
        </ChartFrame>
      ) : null}

      {can("issues.view") ? (
        <ChartFrame
          title="Holat taqsimoti"
          href="/issues"
          hrefLabel="Ro'yxat"
          className="lg:col-span-6 xl:col-span-2"
        >
          <StatusDonut counts={stats} />
        </ChartFrame>
      ) : null}

      {/* ══ 4. YO'NALISHLAR ══════════════════════════════════ */}
      {can("reports.view") ? (
        <ChartFrame
          title="Eng ko'p yo'nalishlar"
          subtitle="Qizil rozetka — muddati o'tganlari"
          className="lg:col-span-3"
        >
          <CategoryBars
            rows={(categories.data ?? []).map((row) => ({
              id: row.categoryId,
              // ⚠️ OTA YO'NALISH BILAN: yakka "Ichimlik suvi"
              // kontekstsiz qolardi (AI promptidagi ayni sabab).
              name: row.parentName ? `${row.parentName} → ${row.name}` : row.name,
              color: row.color,
              icon: row.icon,
              count: row.count,
              overdue: row.overdue,
            }))}
            limit={6}
          />
        </ChartFrame>
      ) : null}

      {/*
        ══ 5. QAMROV VA KUZATUV ═════════════════════════════

        ⚠️ "NIMANI KO'RMAYAPMIZ" — PANELNING ENG JIM SAVOLI:
        qoplanmagan MFY dan na signal, na xavfsizlik hodisasi
        keladi va bu hech qanday raqamda ko'rinmasdi.
      */}
      {can("reports.view") || can("groups.view") ? (
        <ChartFrame
          title="Qamrov va kuzatuv"
          href={can("reports.view") ? "/coverage" : "/groups"}
          hrefLabel={can("reports.view") ? "Qamrov" : "Guruhlar"}
          className="lg:col-span-3"
        >
          <div className="space-y-1">
            {can("reports.view") && coverage.data ? (
              <>
                <StatRow
                  label="MFY jami"
                  value={coverage.data.totals.mahallaTotal}
                />
                <StatRow
                  label="Bot kirgan"
                  value={coverage.data.totals.covered}
                  tone="primary"
                />
                {/*
                  ⚠️ BOTSIZ MFY — ASOSIY BO'SHLIQ: o'sha mahalla
                  butunlay kuzatuvsiz.
                */}
                <StatRow
                  label="Botsiz MFY"
                  value={coverage.data.totals.notAttached}
                  tone={coverage.data.totals.notAttached ? "warning" : "default"}
                  href="/coverage"
                />
              </>
            ) : null}

            {can("groups.view") ? (
              <>
                <StatRow label="Jami chat" value={groupStats.data?.total ?? "—"} />
                <StatRow
                  label="Kuzatuvda"
                  value={groupStats.data?.official ?? "—"}
                  tone="primary"
                  href="/groups?official=true"
                />
                {/*
                  ⚠️ KANAL ALOHIDA: unga qalqon tegishli emas va
                  pastdagi qalqon soni uni hisobga olmaydi.
                  ⚠️ NOL BO'LSA KO'RSATILMAYDI.
                */}
                {groupStats.data?.channels ? (
                  <StatRow
                    label="Kanal"
                    value={groupStats.data.channels}
                    href="/groups?chatType=channel"
                  />
                ) : null}
                <StatRow
                  label="Navbatdagi xabar"
                  value={groupStats.data?.pendingMessages ?? "—"}
                />
              </>
            ) : null}
          </div>
        </ChartFrame>
      ) : null}

      {/*
        ══ 6. XAVFSIZLIK ════════════════════════════════════

        ⚠️ ASOSIY EKRANGA CHIQARILDI: qalqon aholini firibgarlikdan
        himoya qiladi va u JIM ishlaydi — bot guruhga ogohlantirish
        YOZMAYDI. Ya'ni "ishlayaptimi yoki yo'qmi" degan savolga
        javob faqat shu raqamlardan keladi.
      */}
      {can("security.view") ? (
        <ChartFrame
          title="Xavfsizlik qalqoni"
          href="/security"
          hrefLabel="Hodisalar"
          className="lg:col-span-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              icon={ShieldCheck}
              label="O'chirilgan xabar"
              value={security.data?.deleted ?? "—"}
              tone="primary"
            />
            <MiniStat
              icon={Clock}
              label="24 soatda"
              value={security.data?.last24h ?? "—"}
            />
            {/*
              ⚠️ "YOQILGAN / JAMI" BIRGA: yakka "40 ta" degan son
              ko'p yoki kamligini aytmaydi.
            */}
            <MiniStat
              icon={ShieldCheck}
              label="Qalqon yoqilgan"
              value={
                security.data ? `${security.data.guardedGroups} / ${guardTotal}` : "—"
              }
            />
            {/*
              ⚠️ "YOQILGAN, LEKIN ISHLAMAYDI" — ENG XAVFLI HOLAT:
              panelda himoya bor deb ko'rinadi, bot esa hech narsa
              o'chira olmaydi va buni hech kim sezmaydi.
            */}
            <MiniStat
              icon={ShieldAlert}
              label="Qalqon ishlamayapti"
              value={security.data?.blindGroups ?? "—"}
              tone={security.data?.blindGroups ? "danger" : "default"}
              href="/groups"
            />
          </div>

          {/*
            ⚠️ NOTO'G'RI O'CHIRISH — QOIDA SIFATINING YAGONA
            O'LCHOVI: o'smayotgan bo'lsa qoida aniq ishlayapti.
            Nol bo'lsa ko'rsatilmaydi.
          */}
          {security.data?.falsePositives ? (
            <div className="mt-3">
              <StatRow
                label="Noto'g'ri o'chirilgan"
                value={security.data.falsePositives}
                tone="warning"
                href="/security"
              />
            </div>
          ) : null}
        </ChartFrame>
      ) : null}

      {/*
        ══ 7. XIZMAT SIFATI ═════════════════════════════════

        ⚠️ "HAL QILINDI" DEGAN SON YETMAYDI: murojaat hal qilingan
        bo'lishi mumkin, lekin to'qqiz kunda. Javob TEZLIGI xizmat
        sifatining asosiy o'lchovi va u yuqoridagi ulushdan BOSHQA
        savolga javob beradi.

        ⚠️ MANBA — ILOVA MUROJAATLARI (`/reports/mobile`): SLA va
        o'rtacha javob faqat shu kesimda hisoblanadi. Sarlavhada
        aytiladi, aks holda raqam BUTUN platformaga tegishli deb
        o'qilardi.
      */}
      {can("citizens.view") && can("reports.view") ? (
        <ChartFrame
          title="Xizmat sifati"
          subtitle="Ilovadan kelgan murojaatlar bo'yicha"
          href="/?tab=issues"
          hrefLabel="Batafsil"
          className="lg:col-span-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              icon={Clock}
              label="O'rtacha javob"
              value={
                mobile.data?.avgResponseHours != null
                  ? `${mobile.data.avgResponseHours} soat`
                  : "—"
              }
            />
            <MiniStat
              icon={CheckCircle2}
              label="Muddatida bajarilgan"
              value={
                mobile.data?.slaOnTimeRate != null
                  ? `${mobile.data.slaOnTimeRate}%`
                  : "—"
              }
              tone="primary"
            />
            <MiniStat
              icon={Smartphone}
              label="Ilovadan jami"
              value={mobile.data?.total ?? "—"}
              href="/issues?source=mobile"
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
        ══ 8. AUDITORIYA ════════════════════════════════════

        ⚠️ SONLAR QO'SHILMAYDI: guruhdagi odam botga yozmagan
        bo'lishi mumkin va teskarisi ham. Qo'shilsa, bir odam IKKI
        MARTA sanalardi.

        ⚠️ KANAL OBUNACHILARI AYNI SABABDAN ALOHIDA va u eng kuchli
        holat: MFY ning guruhi ham, kanali ham bo'lsa, o'sha mahalla
        aholisi odatda IKKALASIGA a'zo.

        ⚠️ SO'Z HAM BOSHQA: guruhda "a'zo", kanalda "obunachi".
      */}
      {can("groups.view") || can("citizens.view") ? (
        <ChartFrame title="Auditoriya" className="lg:col-span-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {can("groups.view") ? (
              <>
                {/* ⚠️ `formatPeople` — YAGONA MANBA. */}
                <MiniStat
                  icon={MessagesSquare}
                  label="Guruh a'zolari"
                  value={
                    groupStats.data ? formatPeople(groupStats.data.groupMembers) : "—"
                  }
                  tone="primary"
                />
                {groupStats.data?.channels ? (
                  <MiniStat
                    icon={Megaphone}
                    label="Kanal obunachilari"
                    value={formatPeople(groupStats.data.channelMembers)}
                    tone="primary"
                  />
                ) : null}
              </>
            ) : null}

            {can("citizens.view") && can("reports.view") ? (
              <>
                <MiniStat
                  icon={UserCircle}
                  label="Ro'yxatdan o'tgan"
                  value={mobile.data?.citizens.total ?? "—"}
                  href="/citizens"
                />
                {/*
                  ⚠️ "BOTDA" ≠ "RO'YXATDAN O'TGAN": Google bilan
                  kirgan fuqaroda `telegramId` yo'q va unga tarqatma
                  BORMAYDI — tarqatma qarorini aynan shu son
                  belgilaydi.
                */}
                <MiniStat
                  icon={Send}
                  label="Botda (xabar boradi)"
                  value={mobile.data?.citizens.telegram ?? "—"}
                />
                {/*
                  ⚠️ "FAOL" ALOHIDA: botni bir marta ochib tashlab
                  ketgan odam ro'yxatda abadiy qoladi, ya'ni jami son
                  yildan-yilga o'sib, ma'nosini yo'qotadi.
                */}
                <MiniStat
                  icon={Users}
                  label="30 kunda faol"
                  value={mobile.data?.citizens.recent ?? "—"}
                />
              </>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {can("broadcast.send") ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/broadcasts">Xabar yuborish</Link>
              </Button>
            ) : null}
            {can("reports.view") ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/coverage">
                  <Network className="size-4" />
                  Qamrov hisoboti
                </Link>
              </Button>
            ) : null}
          </div>
        </ChartFrame>
      ) : null}
    </div>
  );
};
