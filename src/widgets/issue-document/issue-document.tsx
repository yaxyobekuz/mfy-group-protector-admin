"use client";

/**
 * MUROJAAT HUJJATI — rasmiy ko'rinish, chop etish uchun.
 *
 * ── NEGA ALOHIDA KO'RINISH ─────────────────────────────────────────
 *
 * ⚠️ BU KO'RINISH FUNKSIONAL EMAS, MA'LUMOT BERUVCHI. Murojaat
 * kartasida tugmalar bor (ijrochi tayinlash, yopish, izoh yozish) —
 * ular ISH QUROLI. Hujjat esa HOLATNING SURATI: nima bo'lgan, kim
 * yuborgan, qayerda, kim qaror qilgan. Shuning uchun bu yerda
 * BITTA HAM amal tugmasi yo'q va bo'lmasligi ham kerak: qog'ozga
 * chiqqan hujjatda bosiladigan tugma ma'nosiz, ekranda esa
 * "hujjatni o'qiyapman" va "murojaatni boshqaryapman" ikki boshqa
 * ish — aralashtirilsa, operator hujjatni o'qib turib tasodifan
 * murojaatni yopib qo'yishi mumkin edi.
 *
 * ── NEGA YANGI SAHIFA EMAS ─────────────────────────────────────────
 *
 * ⚠️ `/issues/:id/document` ALOHIDA MARSHRUT QILINMADI: hujjat AYNI
 * ma'lumotni ko'rsatadi va alohida sahifa o'sha so'rovni IKKINCHI
 * marta yuborardi, ikki ko'rinish esa bir-biridan ajralib ketardi
 * (bittasiga maydon qo'shilib, ikkinchisida unutilardi). Bu — AYNI
 * sahifaning ikkinchi KO'RINISHI, `view` holati bilan almashadi.
 *
 * ── CHOP ETISH ─────────────────────────────────────────────────────
 *
 * ⚠️ `window.print()` — PDF EKSPORTI KUTUBXONASI O'RNIGA: brauzer
 * chop etish oynasida "PDF sifatida saqlash" allaqachon bor, ya'ni
 * kutubxona faqat 300 KB qo'shib, AYNI ishni qilardi. Qanday
 * ko'rinishi esa `globals.css` dagi `@media print` bloki bilan
 * boshqariladi (`.print-sheet`).
 *
 * ⚠️ HUJJAT RAQAMI O'YLAB TOPILMAYDI: `publicNo` — bazadagi
 * HAQIQIY raqam. Chop etilgan qog'ozdagi raqam panelda topilmasa,
 * hujjat ishonchini yo'qotardi.
 */

import type { ReactNode } from "react";
import { Printer, X } from "lucide-react";

import type { IssueDetail } from "@/shared/api/types";
import {
  ISSUE_PRIORITY,
  ISSUE_SOURCE,
  ISSUE_STATUS,
  SIGNAL_KIND,
  SIGNAL_SEVERITY,
} from "@/shared/config/labels";
import { formatDateTimeUz, formatDateUz } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";

import { Emblem } from "./emblem";

/** Hujjatdagi bitta qator (nom + qiymat). */
const Field = ({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  /** Uzun matn — ikki ustunni egallaydi. */
  wide?: boolean;
}) => (
  <div className={wide ? "sm:col-span-2" : undefined}>
    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-0.5 text-sm font-medium leading-snug">{value}</dd>
  </div>
);

/** Hujjat bo'limi — sarlavha + ajratgich. */
const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="print-block">
    <h2 className="border-b border-foreground/25 pb-1 text-[12px] font-bold uppercase tracking-wider">
      {title}
    </h2>
    <div className="pt-3">{children}</div>
  </section>
);

export const IssueDocument = ({
  data,
  onClose,
}: {
  data: IssueDetail;
  onClose: () => void;
}) => {
  const status = ISSUE_STATUS[data.status];
  const priority = ISSUE_PRIORITY[data.priority];
  const source = ISSUE_SOURCE[data.source];

  const meta = data.sourceMeta ?? {};
  const groupTitle = typeof meta.groupTitle === "string" ? meta.groupTitle : null;
  const senderName = typeof meta.senderName === "string" ? meta.senderName : null;

  /** Murojaat egasi — fuqaro yoki xodim (manbaga qarab). */
  const applicant = data.citizen
    ? `${data.citizen.firstName} ${data.citizen.lastName ?? ""}`.trim()
    : data.author
      ? `${data.author.firstName} ${data.author.lastName}`
      : null;

  /*
   * ⚠️ FAQAT OMMAVIY IZOHLAR: ichki izohlar xodimlarning o'zaro
   * yozishmasi ("bu allaqachon hal qilingan edi, tekshir") va ular
   * murojaatchiga ko'rsatilishi uchun yozilmagan. Hujjat esa chop
   * etiladi va qo'ldan-qo'lga o'tadi — ichki eslatma u yerga tushib
   * qolsa, uni qaytarib bo'lmasdi.
   */
  const publicComments = data.comments.filter((comment) => comment.isPublic);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* ── Boshqaruv (qog'ozga CHIQMAYDI) ───────────────────────── */}
      <div className="print-hide flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="size-4" />
          Hujjatni yopish
        </Button>

        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Chop etish
        </Button>
      </div>

      {/* ── VARAQ ────────────────────────────────────────────────── */}
      <article className="print-sheet rounded-2xl border border-border bg-card px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        {/* ── Blanka sarlavhasi ──────────────────────────────────── */}
        <header className="print-block flex flex-col items-center gap-3 border-b-2 border-foreground/70 pb-5 text-center">
          {/* ⚠️ 80px: 64px da chizma detallari (nurlar, tog'lar,
              lenta) bir-biriga qo'shilib, dog'ga aylanardi. */}
          <Emblem className="h-20 w-auto text-foreground" />

          <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              O&apos;zbekiston Respublikasi
            </p>
            <p className="text-base font-bold uppercase tracking-wide">
              Viloyat shtabi
            </p>
            <p className="text-[11px] text-muted-foreground">
              Mahalla muammolarini hal qilish tizimi
            </p>
          </div>
        </header>

        {/* ── Hujjat nomi va raqami ──────────────────────────────── */}
        <div className="print-block mt-6 text-center">
          <h1 className="text-[15px] font-bold uppercase tracking-wide">
            Murojaat bayonnomasi
          </h1>

          {/*
            ⚠️ RAQAM VA SANA CHETLARDA: rasmiy hujjat shakli shunday
            ("№ ___ , ___ sana"). O'rtada bo'lsa sarlavhaga qo'shilib
            ketardi.
          */}
          <div className="mt-2 flex items-baseline justify-between text-sm">
            <span>
              № <span className="font-semibold">{data.publicNo}</span>
            </span>
            <span className="text-muted-foreground">
              {formatDateUz(data.createdAt)}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* ── Umumiy ma'lumot ──────────────────────────────────── */}
          <Block title="Umumiy ma'lumot">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field label="Mavzu" value={data.title} wide />
              <Field label="Yo'nalish" value={data.category.name} />
              <Field label="Kelib tushgan yo'l" value={source.label} />
              <Field label="Holati" value={status.label} />
              <Field label="Ustuvorlik" value={priority.label} />
              <Field
                label="Ro'yxatga olingan"
                value={formatDateTimeUz(data.createdAt)}
              />
              {data.dueAt ? (
                <Field label="Belgilangan muddat" value={formatDateUz(data.dueAt)} />
              ) : null}
            </dl>
          </Block>

          {/* ── Murojaatchi va hudud ─────────────────────────────── */}
          <Block title="Murojaatchi va hudud">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field
                label={data.source === "signal" ? "Biriktirgan xodim" : "Murojaatchi"}
                value={applicant ?? "Ko'rsatilmagan"}
              />
              {data.citizen?.phone ? (
                <Field label="Aloqa telefoni" value={data.citizen.phone} />
              ) : null}

              <Field
                label="Mahalla"
                value={data.mahalla ? data.mahalla.name : "Belgilanmagan"}
              />
              <Field
                label="Tuman"
                value={data.mahalla ? data.mahalla.district.name : "Belgilanmagan"}
              />

              {data.mahalla?.chairmanName ? (
                <Field
                  label="MFY raisi"
                  value={`${data.mahalla.chairmanName}${
                    data.mahalla.chairmanPhone
                      ? ` · ${data.mahalla.chairmanPhone}`
                      : ""
                  }`}
                  wide
                />
              ) : null}

              {data.address ? <Field label="Manzil" value={data.address} wide /> : null}

              {data.lat !== null && data.lng !== null ? (
                <Field
                  label="Koordinata"
                  value={`${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`}
                />
              ) : null}

              {data.occurredAt ? (
                <Field
                  label="Sodir bo'lgan vaqt"
                  value={formatDateTimeUz(data.occurredAt)}
                />
              ) : null}
            </dl>
          </Block>

          {/* ── Murojaat mazmuni ─────────────────────────────────── */}
          <Block title="Murojaat mazmuni">
            {/* ⚠️ `whitespace-pre-wrap`: aholi yozgan matndagi qator
                uzilishlari saqlanadi — hujjatda matn ASL holida
                keltirilishi kerak, qayta terilgan emas. */}
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.body}</p>

            {/*
              ⚠️ FUQARO BAYROQLARI "BAHO" DEB YOZILADI: ular
              ustuvorlikni o'zgartirmaydi (CLAUDE.md) va hujjatda
              fakt sifatida turishi mumkin emas — "xavfli" deb
              murojaatchining o'zi belgilagan, tizim emas.
            */}
            {data.isHazard || data.isLongStanding || data.isRepeatAppeal ? (
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium">Murojaatchi belgilagan:</span>{" "}
                {[
                  data.isHazard ? "xavfli" : null,
                  data.isLongStanding ? "uzoqdan davom etmoqda" : null,
                  data.isRepeatAppeal ? "takroriy" : null,
                ]
                  .filter(Boolean)
                  .join(", ")}{" "}
                — murojaatchining o&apos;z bahosi.
              </p>
            ) : null}
          </Block>

          {/* ── Manba (signaldan kelgan bo'lsa) ──────────────────── */}
          {data.signal || groupTitle ? (
            <Block title="Manba ma'lumoti">
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {groupTitle ? (
                  <Field label="Telegram guruhi" value={groupTitle} />
                ) : null}
                {senderName ? (
                  <Field label="Guruhda yozgan shaxs" value={senderName} />
                ) : null}
                {data.signal ? (
                  <>
                    <Field
                      label="Signal turi"
                      value={SIGNAL_KIND[data.signal.kind].label}
                    />
                    {/*
                      ⚠️ "AI BAHOSI" DEB AYNAN YOZILADI: signal — AI
                      TAXMINI, rasmiy xulosa emas (CLAUDE.md).
                      Hujjatda shunchaki "Daraja: yuqori" deb tursa,
                      uni tizim rasmiy ravishda belgilagandek
                      o'qilardi.
                    */}
                    <Field
                      label="AI bahosi (taxmin)"
                      value={SIGNAL_SEVERITY[data.signal.severity].label}
                    />
                  </>
                ) : null}
              </dl>
            </Block>
          ) : null}

          {/* ── Biriktirilgan dalillar ───────────────────────────── */}
          {data.attachments.length > 0 ? (
            <Block title="Biriktirilgan dalillar">
              {/*
                ⚠️ FAYLLAR RO'YXAT SIFATIDA, RASM SIFATIDA EMAS: chop
                etishda suratlar butun betni egallab, hujjat o'nlab
                betga cho'zilardi. Hujjatning vazifasi — dalil
                BORLIGINI qayd etish; suratning o'zi murojaat
                kartasida ko'riladi.
              */}
              <ul className="space-y-1 text-sm">
                {data.attachments.map((file, index) => (
                  <li key={file.id} className="flex items-baseline gap-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span>
                      {file.kind === "video" ? "Video yozuv" : "Surat"} ·{" "}
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}

          {/* ── Ko'rib chiqish natijasi ──────────────────────────── */}
          <Block title="Ko'rib chiqish natijasi">
            {data.resolution ? (
              <div className="space-y-3">
                <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  <Field label="Qaror" value={status.label} />
                  {data.reviewedAt ? (
                    <Field
                      label="Qaror sanasi"
                      value={formatDateTimeUz(data.reviewedAt)}
                    />
                  ) : null}
                  {data.reviewer ? (
                    <Field
                      label="Qaror qabul qilgan"
                      value={`${data.reviewer.firstName} ${data.reviewer.lastName}`}
                    />
                  ) : null}
                  {data.assignee ? (
                    <Field
                      label="Ijrochi"
                      value={`${data.assignee.firstName} ${data.assignee.lastName}`}
                    />
                  ) : null}
                </dl>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {data.status === "rejected" ? "Rad etish sababi" : "Javob matni"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                    {data.resolution}
                  </p>
                </div>
              </div>
            ) : (
              /*
                ⚠️ "HALI YOPILMAGAN" DEB YOZILADI, BO'LIM TASHLANMAYDI:
                hujjatda bo'lim yo'qligi "javob berilgan, lekin
                yozilmagan" deb ham o'qilishi mumkin edi. Ochiq
                holat — AYTILADIGAN fakt.
              */
              <p className="text-sm text-muted-foreground">
                Murojaat hali yopilmagan. Joriy holati —{" "}
                <span className="font-medium text-foreground">{status.label}</span>.
                {data.assignee
                  ? ` Ijrochi: ${data.assignee.firstName} ${data.assignee.lastName}.`
                  : " Ijrochi belgilanmagan."}
              </p>
            )}
          </Block>

          {/* ── Murojaatchiga yuborilgan xabarlar ────────────────── */}
          {publicComments.length > 0 ? (
            <Block title="Murojaatchiga yuborilgan xabarlar">
              <ul className="space-y-3">
                {publicComments.map((comment) => (
                  <li key={comment.id} className="border-l-2 border-foreground/20 pl-3">
                    <p className="text-[11px] text-muted-foreground">
                      {comment.user
                        ? `${comment.user.firstName} ${comment.user.lastName}`
                        : comment.citizen
                          ? `${comment.citizen.firstName} ${comment.citizen.lastName ?? ""} (murojaatchi)`.trim()
                          : "—"}{" "}
                      · {formatDateTimeUz(comment.createdAt)}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">
                      {comment.body}
                    </p>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}
        </div>

        {/* ── IMZO JOYI ────────────────────────────────────────────
          ⚠️ IMZO BO'SH QOLDIRILADI: tizim kimningdir imzosini CHIZIB
          BERA OLMAYDI va bergan taqdirda ham bu soxta dalil bo'lardi.
          Hujjat qog'ozda qo'l bilan imzolanadi — bu yerda faqat JOY.
        */}
        <div className="print-sign mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Mas&apos;ul xodim
            </p>
            <div className="mt-8 border-t border-foreground/40 pt-1 text-[11px] text-muted-foreground">
              imzo / F.I.Sh.
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Sana
            </p>
            <div className="mt-8 border-t border-foreground/40 pt-1 text-[11px] text-muted-foreground">
              kun / oy / yil
            </div>
          </div>
        </div>

        {/* ── Kolontitul ───────────────────────────────────────────
          ⚠️ HUJJAT QAYERDAN OLINGANI YOZILADI: chop etilgan varaq
          tizimdan ajralib, alohida hayot boshlaydi. Manbasiz
          qog'ozni keyin tekshirib bo'lmasdi — raqam bo'yicha panelda
          topish mumkin bo'lishi kerak.
        */}
        <footer className="mt-8 border-t border-border pt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
          Hujjat &laquo;Viloyat shtabi&raquo; axborot tizimidan avtomatik
          shakllantirilgan. Asl nusxa tizimda {data.publicNo} raqami bilan
          saqlanadi.
        </footer>
      </article>
    </div>
  );
};
