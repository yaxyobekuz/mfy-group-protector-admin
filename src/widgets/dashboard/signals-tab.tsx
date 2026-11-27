"use client";

/**
 * "SIGNALLAR" TABI — AI GURUHLARDA NIMA TOPDI.
 *
 * ⚠️ SIGNAL — MUAMMO EMAS (doktrina): bu tabdagi raqamlar AI
 * TAXMINI haqida, rasmiy navbat haqida emas. Shuning uchun u
 * "Murojaatlar" tabidan ATAYLAB alohida: ikkisi bitta kartaga
 * qo'yilsa, "40 ta signal, 120 ta murojaat" degan qator ularni
 * BIR XIL narsadek ko'rsatardi.
 *
 * ⚠️ TAHLIL HOLATI — BU TABNING ASOSIY QISMI, pastdagi izoh emas.
 * Bo'sh signal ro'yxatini ko'rgan operator "guruhlarda gap yo'q"
 * deb o'ylardi — aslida tahlil umuman ishlamayotgan bo'lishi
 * mumkin. "Tahlil qilinmadi" va "gap topilmadi" BOSHQA narsa.
 *
 * ⚠️ RO'YXATNING O'ZI BU YERDA EMAS: signal bilan ishlash
 * (biriktirish, e'tiborsiz qoldirish) `/signals` sahifasida —
 * oyna, filtr va sahifalash bilan. Bu yerda faqat OXIRGILARI
 * ko'rsatiladi, ya'ni "qarash kerakmi yoki yo'qmi" degan savolga
 * javob.
 */

import {
  CheckCircle2,
  Filter,
  Layers,
  MessagesSquare,
  Radio as RadioIcon,
  RefreshCw,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { useSession } from "@/entities/session/auth-provider";
import { useGroupStats } from "@/features/groups/api";
import {
  useRunAnalysis,
  useSignalCounts,
  useSignalStatus,
  useSignals,
} from "@/features/signals/api";
import type { Signal } from "@/shared/api/types";
import { SIGNAL_SEVERITY } from "@/shared/config/labels";
import { cn } from "@/shared/lib/cn";
import { formatRelativeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/states";
import { ChartFrame } from "@/widgets/dashboard/chart-frame";
import { MiniStat, NoData, StatRow } from "@/widgets/dashboard/parts";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

export const SignalsTab = () => {
  const { can } = useSession();

  const counts = useSignalCounts();
  const status = useSignalStatus();
  const runAnalysis = useRunAnalysis();
  const groupStats = useGroupStats();

  /**
   * ⚠️ FAQAT KO'RILMAGANLARI VA FAQAT BESHTASI: bu tab ro'yxat
   * emas, "qarash kerakmi" degan savolga javob. Yigirmatasi
   * ko'rsatilsa, u `/signals` sahifasining yarim nusxasi bo'lib
   * qolardi — va ikkisi bir kuni ajralib ketardi.
   */
  const latest = useSignals({ status: "new", limit: 5 });

  const job = status.data;
  const result = job?.lastResult;
  const isRunning = runAnalysis.isPending || job?.isRunning;

  return (
    <div className="grid auto-rows-min items-start gap-4 lg:grid-cols-6">
      {/* ── 1-QATOR: SANOQLAR ───────────────────────────────── */}
      <div className="lg:col-span-3 xl:col-span-2">
        <StatTile
          label="Ko'rilmagan"
          value={counts.data?.new ?? "—"}
          icon={RadioIcon}
          featured
          href="/signals?status=new"
        />
      </div>

      <div className="lg:col-span-3 xl:col-span-2">
        <StatTile
          label="Yuqori jiddiylik"
          value={counts.data?.highNew ?? "—"}
          icon={TriangleAlert}
          tone={counts.data?.highNew ? "danger" : "default"}
          href="/signals?severity=high"
        />
      </div>

      <div className="lg:col-span-3 xl:col-span-1">
        <StatTile
          label="Murojaatga aylangan"
          value={counts.data?.attached ?? "—"}
          icon={CheckCircle2}
          tone="success"
          href="/signals?status=attached"
        />
      </div>

      <div className="lg:col-span-3 xl:col-span-1">
        <StatTile
          label="E'tiborsiz qoldirilgan"
          value={counts.data?.dismissed ?? "—"}
          icon={XCircle}
          href="/signals?status=dismissed"
        />
      </div>

      {/* ── 2-QATOR: OXIRGI SIGNALLAR ───────────────────────── */}
      <ChartFrame
        title="Oxirgi ko'rilmagan signallar"
        href="/signals"
        hrefLabel="Hammasi"
        className="lg:col-span-6 xl:col-span-4"
      >
        {latest.isLoading ? (
          <NoData text="Yuklanmoqda…" />
        ) : (latest.data?.items.length ?? 0) === 0 ? (
          <NoData text="Ko'rilmagan signal yo'q" />
        ) : (
          <ul className="divide-y">
            {latest.data?.items.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </ul>
        )}
      </ChartFrame>

      {/* ── 3-QATOR: TAHLIL HOLATI ──────────────────────────── */}
      <ChartFrame
        title="AI tahlili"
        subtitle={job?.model ?? undefined}
        className="lg:col-span-6 xl:col-span-2"
        action={
          can("signals.run") ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAnalysis.mutate()}
              disabled={isRunning}
            >
              {isRunning ? <Spinner /> : <RefreshCw className="size-4" />}
              Tekshirish
            </Button>
          ) : undefined
        }
      >
        {/*
          ⚠️ AI O'CHIRILGANI ENG YUQORIDA VA RANG BILAN: bu holatda
          guruh xabarlari TO'PLANIB turadi, lekin tahlil qilinmaydi
          — ya'ni panel "signal yo'q" deb ko'rsatib, aslida hech
          narsa ko'rmayapti.
        */}
        {job && !job.aiEnabled ? (
          <div className="mb-3 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
            <p className="font-semibold">Tahlil ishlamayapti</p>
            <p className="mt-0.5">
              Guruh xabarlari to&apos;planib turadi, lekin ko&apos;rilmaydi.
            </p>
          </div>
        ) : null}

        <div className="space-y-1">
          <StatRow
            label="Oxirgi tekshiruv"
            value={job?.lastRunAt ? formatRelativeUz(job.lastRunAt) : "—"}
          />
          {/*
            ⚠️ NAVBAT UZUN BO'LISHI NORMAL (tahlil oraliqda
            ishlaydi) — shuning uchun u oddiy qator, ogohlantirish
            emas.
          */}
          <StatRow
            label="Navbatdagi xabar"
            value={groupStats.data?.pendingMessages ?? result?.pending ?? "—"}
          />
          {/*
            ⚠️ XATO BERGAN GURUH ALOHIDA: o'sha guruhlarda xabar
            `analyzedAt` siz qoladi va keyingi aylanishda qayta
            ko'riladi — ya'ni "signal yo'q" degani "tahlil
            bo'lmadi" degani ham bo'lishi mumkin.

            ⚠️ NOL BO'LSA KO'RSATILMAYDI.
          */}
          {result?.failedGroups ? (
            <StatRow
              label="Xato bergan guruh"
              value={result.failedGroups}
              tone="danger"
            />
          ) : null}
        </div>

        {/*
          ── OXIRGI AYLANISH NATIJASI ────────────────────────

          ⚠️ SHOVQIN FILTRI SONI KO'RSATILADI: filtr jim ishlasa,
          u juda qattiq bo'lib ketganini hech kim sezmasdi —
          panelda esa "signal kam" degan xulosa chiqardi.
        */}
        {result ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniStat icon={MessagesSquare} label="Ko'rilgan xabar" value={result.analyzed} />
            <MiniStat
              icon={RadioIcon}
              label="Topilgan signal"
              value={result.signals}
              tone="primary"
            />
            <MiniStat icon={Filter} label="Shovqin filtri" value={result.filtered} />
            <MiniStat icon={Layers} label="Takrorga qo'shilgan" value={result.merged} />
          </div>
        ) : null}
      </ChartFrame>

      {/* ── 4-QATOR: QAMROV ─────────────────────────────────── */}
      {can("groups.view") ? (
        <ChartFrame
          title="Signal qayerdan keladi"
          href="/coverage"
          hrefLabel="Qamrov"
          className="lg:col-span-6"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/*
              ⚠️ FAQAT KUZATUVDAGI CHATLAR TAHLIL QILINADI
              (`isOfficial`): jami son bilan birga ko'rsatilmasa,
              "nega 120 guruhdan faqat 40 tasida signal bor" degan
              savolga javob yo'q edi.
            */}
            <MiniStat
              icon={RadioIcon}
              label="Kuzatuvda"
              value={groupStats.data?.official ?? "—"}
              tone="primary"
              href="/groups?official=true"
            />
            <MiniStat
              icon={MessagesSquare}
              label="Jami chat"
              value={groupStats.data?.total ?? "—"}
              href="/groups"
            />
            {groupStats.data?.channels ? (
              <MiniStat
                icon={Layers}
                label="Kanal"
                value={groupStats.data.channels}
                href="/groups?chatType=channel"
              />
            ) : null}
            {/*
              ⚠️ MFY BIRIKTIRILMAGAN CHAT — SIGNAL YO'QOLADIGAN
              JOY: signaldan yaratilgan murojaatda hudud guruhdan
              o'qiladi va biriktirilmagan chatda u bo'sh qoladi.
            */}
            <MiniStat
              icon={TriangleAlert}
              label="MFY biriktirilmagan"
              value={groupStats.data?.unassigned ?? "—"}
              tone={groupStats.data?.unassigned ? "warning" : "default"}
              href="/groups?unassigned=true"
            />
          </div>
        </ChartFrame>
      ) : null}
    </div>
  );
};

/**
 * OXIRGI SIGNAL — IXCHAM QATOR.
 *
 * ⚠️ `SignalCard` DAN FARQI: unda amal tugmalari bor
 * (biriktirish, e'tiborsiz qoldirish) va u butun kartani
 * egallaydi. Bu yerda esa BESHTASI bir kartaga sig'ishi kerak,
 * ya'ni amal yo'q — bosilganda `/signals` ga o'tadi.
 *
 * ⚠️ MATN — XABARNING O'ZI (`summary`), AI xulosasi emas
 * (doktrina: "AI matn yozmaydi"). Shuning uchun u QISQARTIRILADI,
 * qayta yozilmaydi.
 */
const SignalRow = ({ signal }: { signal: Signal }) => {
  const severity = SIGNAL_SEVERITY[signal.severity];

  return (
    <li>
      <Link
        href="/signals"
        className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary"
      >
        {/*
          ⚠️ JIDDIYLIK — RANGLI NUQTA VA ROZETKA: rang YAKKA O'ZI
          ma'lumot tashimaydi (daltonizm), shuning uchun yonida
          yorliq ham turadi.
        */}
        <Badge className={cn("mt-0.5 shrink-0", severity.className)}>
          {severity.label}
        </Badge>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm">{signal.summary}</p>

          <p className="mt-1 truncate text-xs text-muted-foreground">
            {signal.group.mahalla
              ? `${signal.group.mahalla.name} · ${signal.group.title}`
              : signal.group.title}
            {signal.category
              ? ` · ${signal.category.parentName ? `${signal.category.parentName} → ` : ""}${signal.category.name}`
              : null}
          </p>
        </div>

        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeUz(signal.sentAt ?? signal.createdAt)}
        </span>
      </Link>
    </li>
  );
};
