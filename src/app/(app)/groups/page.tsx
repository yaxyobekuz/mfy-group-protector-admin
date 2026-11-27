"use client";

/**
 * TELEGRAM GURUHLARI.
 *
 * ⚠️ SAHIFANING ENG MUHIM AMALI — "rasmiy" belgisi va u KUZATUVGA
 * ROZILIK ma'nosini bildiradi: qo'yilgandan keyin tizim guruhdagi
 * xabarlarni o'qiy boshlaydi. Shuning uchun ustun nomi "Kuzatuv"
 * deb yoziladi, "Rasmiy" emas — belgi NIMA QILISHINI aytishi
 * kerak.
 *
 * ⚠️ MFY BIRIKTIRISH — RASMIY BELGIDAN OLDIN. Server
 * biriktirilmagan guruhni kuzatuvga qo'yishni rad etadi: signallar
 * hududsiz qolib, faqat viloyat xodimiga ko'rinardi, ya'ni amalda
 * hech kim ko'rmasdi.
 *
 * ⚠️ RO'YXATDA KANAL HAM BOR — VA U GURUH EMAS. Kanalda aholi
 * yozmaydi, faqat rais post qiladi: kuzatuv (post → AI → signal)
 * ishlaydi, QALQON esa ma'nosiz — zararli kontentni o'sha kanalning
 * O'Z admini yozadi.
 *
 * ⚠️ A'ZOLAR SONI USTUNDA KO'RINADI va u reyestrning asosiy
 * ma'nolaridan biri: "bu kanalda 4 000 obunachi bor" degan son
 * tarqatma qilish, MFY biriktirish va kuzatuvni yoqish bo'yicha
 * qarorni O'ZGARTIRADI. Son bazada allaqachon bor edi
 * (`memberCount`), lekin faqat boshqaruv panelidagi YIG'INDIDA
 * ko'rinardi — ya'ni "qaysi guruh katta" degan savolga javob
 * yo'q edi va xodim buni Telegram'ni ochib qo'lda tekshirardi.
 *
 * ⚠️ SHUNING UCHUN KANAL QATORIDA QALQON TUGMASI YO'Q va "bot
 * o'chira olmaydi" ogohlantirishi ham chiqmaydi: ikkisi ham xodimga
 * TUZATIB BO'LMAYDIGAN vazifa berardi (Telegram kanalda huquq bersa
 * ham qalqon ishga tushmaydi). Yolg'on ogohlantirish haqiqiysini
 * ko'rinmas qiladi.
 */

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPinOff, Megaphone, Radio, Users } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAssignMahalla,
  useGroupStats,
  useGroups,
  useSetOfficial,
  type GroupFilters,
} from "@/features/groups/api";
import { GroupBulkActions } from "@/features/groups/bulk-actions";
import { useSetGuard } from "@/features/security/api";
import { useDistricts, useMahallas } from "@/features/territory/api";
import { ApiError } from "@/shared/api/client";
import { chatTypeLabel, formatPeople, plural } from "@/shared/config/labels";
import { formatDateUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/shared/ui/searchable-select";
import { Switch } from "@/shared/ui/switch";
import { EmptyState, ErrorState, TableSkeleton } from "@/shared/ui/states";
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

const ALL = "__all__";

export default function GroupsPage() {
  const { can } = useSession();

  /**
   * ⚠️ BOSHLANG'ICH FILTR URL'DAN O'QILADI (`issues` va `signals`
   * sahifalaridagi AYNI yo'l): boshqaruv panelidagi "MFY
   * biriktirilmagan", "Kuzatuvda" va "Kanal" sanoqlari
   * `/groups?unassigned=true` kabi havola beradi. O'qilmasa,
   * bosilgan raqam to'liq ro'yxatni ochardi — operator esa o'sha
   * 12 ta chatni 500 qator orasidan O'ZI izlab yurardi.
   */
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<GroupFilters>(() => ({
    unassigned: searchParams.get("unassigned") === "true" ? true : undefined,
    // ⚠️ `isOfficial` — UCH HOLAT: `true`, `false` va "farqi yo'q".
    // Shuning uchun `=== "true"` yetarli emas, qiymat O'QILADI.
    isOfficial:
      searchParams.get("official") === "true"
        ? true
        : searchParams.get("official") === "false"
          ? false
          : undefined,
    chatType:
      searchParams.get("chatType") === "channel"
        ? "channel"
        : searchParams.get("chatType") === "group"
          ? "group"
          : undefined,
    page: 1,
    limit: 50,
  }));

  const groups = useGroups(filters);
  const stats = useGroupStats();
  const districts = useDistricts();

  /**
   * ⚠️ RO'YXAT TO'LIQ OLINADI, TUMAN BO'YICHA SO'RALMAYDI. Sabab
   * jadvalda: har qatordagi MFY tanlovi guruhga ALLAQACHON
   * biriktirilgan MFY ni ko'rsatishi kerak. Ro'yxat filtr bo'yicha
   * kesilsa, boshqa tumandagi guruh qatorida tanlov "Biriktirilmagan"
   * bo'lib ko'rinardi — holbuki u biriktirilgan.
   *
   * Filtr uchun esa pastda ALOHIDA, kesilgan ro'yxat quriladi.
   */
  const mahallas = useMahallas();

  const setOfficial = useSetOfficial();
  const setGuard = useSetGuard();
  const assignMahalla = useAssignMahalla();

  const patch = (next: Partial<GroupFilters>) =>
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));

  /**
   * MFY RO'YXATI — qidiruvli tanlov uchun.
   *
   * ⚠️ TUMAN NOMI `hint` SIFATIDA: viloyatda bir xil nomli MFY
   * bo'lishi mumkin ("Yangiobod" bir necha tumanda bor) va faqat
   * nom ko'rsatilsa, operator qaysi birini tanlayotganini
   * bilmasdi. Qidiruv ham shu matn bo'yicha ishlaydi — tuman
   * nomini yozib ham topish mumkin.
   */
  const mahallaOptions: SearchableOption[] = useMemo(
    () =>
      (mahallas.data ?? []).map((mahalla) => ({
        value: mahalla.id,
        label: mahalla.name,
        hint: mahalla.district.name,
      })),
    [mahallas.data],
  );

  /**
   * FILTR UCHUN MFY RO'YXATI — TANLANGAN TUMAN BO'YICHA.
   *
   * ⚠️ ALOHIDA RO'YXAT, chunki yuqoridagisi BIRIKTIRISH uchun va u
   * to'liq bo'lishi shart. Bu yerda esa teskarisi: tuman tanlangach
   * ro'yxat o'nlab yozuvga tushadi va bir xil nomli MFY lar
   * chalkashligi butunlay yo'qoladi.
   */
  const filterMahallaOptions: SearchableOption[] = useMemo(
    () =>
      filters.districtId
        ? (mahallas.data ?? [])
            .filter((mahalla) => mahalla.district.id === filters.districtId)
            .map((mahalla) => ({ value: mahalla.id, label: mahalla.name }))
        : mahallaOptions,
    [mahallas.data, filters.districtId, mahallaOptions],
  );

  return (
    <>
      <PageHeader
        title="Telegram guruh va kanallari"
      />

      {/*
        ⚠️ TO'RTTA PLITKA, YETTITA EMAS. A'zolar soni avval ALOHIDA
        ikki plitkada turardi va qator ekranga sig'may ketgan edi:
        yetti plitka orasida "MFY biriktirilmagan" — ya'ni ish talab
        qiladigan YAGONA son — ko'zga tashlanmay qolardi.

        ⚠️ SON O'ZI TEGISHLI PLITKA ICHIGA KO'CHDI: "a'zolar" guruh
        sonining IZOHI, mustaqil ko'rsatkich emas. Yonma-yon
        turganda ular bir-biriga teng ikki o'lchovdek ko'rinardi.

        ⚠️ "NAVBATDAGI XABAR" BU SAHIFADAN OLIB TASHLANDI: u
        kuzatuv OQIMI haqida (tahlil qachon bo'ladi), reyestr
        haqida emas. Boshqaruv panelida o'z o'rnida qoladi.
      */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/*
          ⚠️ YIRIK SON — ODAMLAR, CHATLAR EMAS. Reyestrdagi guruhlar
          soni ichki ko'rsatkich: u ma'muriyatga "nechta yozuv bor"
          deydi. Panelning savoli esa boshqa — "biz necha kishiga
          yetib boryapmiz". Tarqatma, qamrov va hisobot qarorlari
          aynan shu songa qaraydi, shuning uchun u plitkaning
          MAZMUNI bo'ldi, guruhlar soni esa uning o'lchovi.

          ⚠️ YORLIQ HAM ALMASHDI: yirik son "a'zolar" bo'lgach,
          ustida "Jami guruh" deb yozib qo'yish sonni noto'g'ri
          o'qitardi — 108 508 ta guruh bordek.

          ⚠️ GURUHLAR SONI KANALSIZ (`total` dan `channels`
          ayirildi): yonida "Kanal" plitkasi turibdi va kanallar
          ikki marta sanalgandek ko'rinardi.
        */}
        <StatTile
          label="Guruh a'zolari"
          value={stats.data ? formatPeople(stats.data.groupMembers) : "—"}
          icon={Users}
          hint={
            stats.data
              ? plural(stats.data.total - stats.data.channels, "guruh")
              : undefined
          }
        />
        <StatTile
          label="Kuzatuvda"
          value={stats.data?.official ?? "—"}
          icon={Radio}
          tone="success"
        />
        {/*
          ⚠️ KANAL ALOHIDA PLITKA: unga qalqon tegishli emas va
          xavfsizlik sahifasidagi "40/80" soni aynan shuning uchun
          jamidan kichik.

          ⚠️ IZOHDA IKKI FAKT BIRGA: obunachilar soni va qalqon
          yo'qligi. Ikkinchisi olib tashlansa, jadvaldagi bo'sh
          qalqon ustuni tushuntirilmagan qolardi.

          ⚠️ "OBUNACHI", "A'ZO" EMAS — va ikkisi QO'SHILMAYDI: MFY
          ning guruhi ham, kanali ham bo'lsa, o'sha mahalla aholisi
          odatda ikkalasiga a'zo.
        */}
        <StatTile
          label="Kanal obunachilari"
          value={stats.data ? formatPeople(stats.data.channelMembers) : "—"}
          icon={Megaphone}
          hint={
            stats.data
              ? `${plural(stats.data.channels, "kanal")} · qalqon yo'q`
              : "Faqat kuzatuv — qalqon yo'q"
          }
        />
        <StatTile
          label="MFY biriktirilmagan"
          value={stats.data?.unassigned ?? "—"}
          icon={MapPinOff}
          tone={stats.data?.unassigned ? "warning" : "default"}
        />
      </div>

      {/* ── Filtrlar ─────────────────────────────────────────── */}
      {/*
        ⚠️ QIDIRUV — BUTUN QATOR (`col-span-full`). U tanlovlar bilan
        bir xil kenglikda turganda ikkisi TENG og'irlikdagi filtrdek
        ko'rinardi, holbuki qidiruv — erkin matn: unga uzun nom ham,
        chat ID ham yoziladi va tor maydonda ular ko'rinmay qolardi.

        ⚠️ TANLOVLAR SONI USTUNLAR SONIGA TENG: qidiruv o'z qatoriga
        chiqqach, pastdagi qator TEKIS bo'linishi kerak — aks holda
        bitta tanlov yolg'iz qolib, yonida bo'sh joy turardi.
      */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          className="col-span-full"
          placeholder="Guruh nomi yoki chat ID..."
          value={filters.search ?? ""}
          onChange={(event) => patch({ search: event.target.value || undefined })}
        />

        <Select
          value={
            filters.isOfficial === undefined ? ALL : filters.isOfficial ? "yes" : "no"
          }
          onValueChange={(value) =>
            patch({ isOfficial: value === ALL ? undefined : value === "yes" })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Kuzatuv" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha guruhlar</SelectItem>
            <SelectItem value="yes">Kuzatuvda</SelectItem>
            <SelectItem value="no">Kuzatuvda emas</SelectItem>
          </SelectContent>
        </Select>

        {/*
          ⚠️ TUMAN FILTRI MFY DAN OLDIN: shahar/tuman kesimi —
          operator birinchi o'ylaydigan narsa, MFY esa ikkinchi.
          Tuman tanlangach quyidagi MFY ro'yxati ham toraydi va bir
          xil nomli MFY lar chalkashligi yo'qoladi.
        */}
        <Select
          value={filters.districtId ?? ALL}
          onValueChange={(value) =>
            patch({
              districtId: value === ALL ? undefined : value,
              // ⚠️ MFY TOZALANADI: eski tanlov yangi tumanga
              // tegishli emas va ikkalasi birga qolsa, ro'yxat jim
              // bo'sh chiqardi.
              mahallaId: undefined,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tuman" />
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

        {/*
          ⚠️ QIDIRUVLI TANLOV: viloyatda yuzlab MFY bor va oddiy
          ro'yxatdan kerakligini topish o'nlab marta aylantirishni
          talab qilardi.
        */}
        <SearchableSelect
          value={filters.mahallaId ?? null}
          onValueChange={(value) =>
            patch({ mahallaId: value ?? undefined, unassigned: undefined })
          }
          options={filterMahallaOptions}
          placeholder="Barcha MFY"
          clearLabel="Barcha MFY"
          searchPlaceholder="MFY yoki tuman nomi..."
          emptyLabel="MFY topilmadi"
        />

        {/*
          ⚠️ CHAT TURI FILTRI: reyestrda guruh ham, kanal ham turadi
          va ularga qilinadigan ish boshqa. Ommaviy qalqon
          kanallarga tushmaydi — operator ro'yxatni oldin
          guruhlarga toraytirsa, "nega 50 tadan 47 tasiga tushdi"
          degan savol umuman paydo bo'lmaydi.
        */}
        <Select
          value={filters.chatType ?? ALL}
          onValueChange={(value) =>
            patch({
              chatType: value === ALL ? undefined : (value as "group" | "channel"),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Guruh va kanal</SelectItem>
            <SelectItem value="group">Faqat guruh</SelectItem>
            <SelectItem value="channel">Faqat kanal</SelectItem>
          </SelectContent>
        </Select>

        {/*
          ⚠️ `sm` DA QATORNI TO'LDIRADI: u yerda to'r ikki ustunli
          va uchta/beshta tanlov tekis bo'linmaydi — oxirgisi yolg'iz
          qolib, yonida bo'sh joy turardi.

          ⚠️ `lg` DA QAYTARILADI: o'sha kenglikda tanlovlar soni
          ustunlar soniga teng va cho'zish bitta tugmani
          qolganlardan ikki barobar keng qilib ko'rsatardi.
        */}
        <Button
          variant={filters.unassigned ? "default" : "outline"}
          className="sm:col-span-2 lg:col-span-1"
          onClick={() =>
            patch({
              unassigned: filters.unassigned ? undefined : true,
              mahallaId: undefined,
            })
          }
        >
          <MapPinOff className="size-4" />
          Biriktirilmaganlar
        </Button>
      </div>

      {/*
        ── Ommaviy amallar ──────────────────────────────────────
        ⚠️ FILTRDAN KEYIN TURADI va bu ataylab: amalning qamrovi —
        ekrandagi filtr natijasi. Filtrlar tepada ko'rinib
        turganda, operator "nimaga nisbatan" degan savolga
        javobni yonidagi maydonlardan o'qiydi.
      */}
      <GroupBulkActions filters={filters} total={groups.data?.total ?? 0} />

      {/* ── Jadval ───────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        {groups.isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : groups.isError ? (
          <ErrorState
            message={groups.error instanceof ApiError ? groups.error.message : undefined}
            onRetry={() => void groups.refetch()}
          />
        ) : (groups.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={Users}
            title="Chat topilmadi"
            hint={
              filters.search ||
              filters.isOfficial !== undefined ||
              filters.chatType ||
              filters.unassigned
                ? "Filtrlarni kengaytirib ko'ring."
                : "Botni MFY guruhiga qo'shing. Bot faqat o'ziga kelgan hodisadan guruhni biladi, shuning uchun qo'shilgandan keyin guruhda biror harakat bo'lishi kerak."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {/*
                  ⚠️ "GURUH" EMAS, "CHAT": ustunda kanal ham turadi
                  va sarlavha uni chetlab o'tgandek ko'rinardi.
                */}
                <TableHead>Chat</TableHead>
                <TableHead>MFY</TableHead>
                {/*
                  ⚠️ A'ZOLAR USTUNI MFY DAN KEYIN, KUZATUVDAN
                  OLDIN: "kuzatuvni yoqamanmi" degan qarorda
                  guruhning HAJMI muhim — 5 a'zoli test guruhi va
                  3 000 a'zoli mahalla guruhi bir xil qiymatda
                  emas. Ustun oxirida tursa, operator qarorni
                  ko'rmay qabul qilardi.
                */}
                <TableHead className="text-right">A&apos;zolar</TableHead>
                <TableHead>Kuzatuv</TableHead>
                <TableHead>Qalqon</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groups.data?.items.map((group) => (
                <TableRow key={group.chatId}>
                  {/* ── Guruh ───────────────────────────────── */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{group.title}</p>
                        {/*
                          ⚠️ KANAL YORLIG'I NOM YONIDA: qalqon
                          ustuni unda bo'sh turadi va SABABI shu
                          yorliqdan o'qiladi — aks holda operator
                          "tugma yuklanmadi" deb o'ylardi.
                        */}
                        {group.isChannel ? (
                          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
                            {chatTypeLabel(group.type)}
                          </Badge>
                        ) : null}
                      </div>
                      {/*
                        ⚠️ `chatId` QATORDA KO'RSATILMAYDI: u uzun
                        manfiy son va har qatorda takrorlanib,
                        o'qiladigan ma'lumotni (nom, username,
                        sana) ko'mib yuborardi. Kerak bo'lganda
                        qidiruv maydoni uni BARIBIR qabul qiladi
                        ("Guruh nomi yoki chat ID...") va
                        biriktirilmaganlar faylida alohida ustun
                        bo'lib chiqadi.
                      */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {group.username ? <span>@{group.username}</span> : null}
                        <span>{formatDateUz(group.joinedAt)}</span>
                      </div>

                      {/*
                        ⚠️ BOT CHIQARIB YUBORILGANI AYTILADI:
                        kuzatuv yoqilgan, lekin bot guruhda yo'q
                        bo'lsa, xabarlar KELMAYDI — va buni hech
                        narsa ko'rsatmasa, operator "nega signal
                        yo'q" deb hayron bo'lardi.
                      */}
                      {!group.isPresent ? (
                        <Badge className="bg-destructive/10 text-destructive">
                          {/*
                            ⚠️ MATN TURGA QARAB: "Bot guruhda yo'q"
                            degan yozuv kanal qatorida xato
                            ko'rinardi va xodim boshqa chatni
                            izlardi.
                          */}
                          Bot {group.isChannel ? "kanalda" : "guruhda"} yo&apos;q
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>

                  {/* ── MFY biriktirish ─────────────────────── */}
                  <TableCell>
                    {can("groups.assign") ? (
                      <SearchableSelect
                        value={group.mahalla?.id ?? null}
                        onValueChange={(value) =>
                          assignMahalla.mutate({
                            chatId: group.chatId,
                            mahallaId: value,
                          })
                        }
                        options={mahallaOptions}
                        placeholder="— Biriktirilmagan —"
                        clearLabel="— Biriktirilmagan —"
                        searchPlaceholder="MFY yoki tuman nomi..."
                        emptyLabel="MFY topilmadi"
                        disabled={assignMahalla.isPending}
                        className="w-60"
                      />
                    ) : group.mahalla ? (
                      <div className="text-sm">
                        <p>{group.mahalla.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.mahalla.district.name}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-amber-600 dark:text-amber-400">
                        Biriktirilmagan
                      </span>
                    )}
                  </TableCell>

                  {/* ── A'zolar ─────────────────────────────── */}
                  {/*
                    ⚠️ `null` — "HALI O'QILMAGAN", `0` DAN BOSHQA
                    NARSA: bot a'zolar sonini 6 soatda bir marta
                    o'qiydi va yangi guruhda u hali bo'sh bo'lishi
                    MUMKIN. `0` ko'rsatilsa, "guruhda hech kim
                    yo'q" degan noto'g'ri xulosa chiqardi.

                    ⚠️ O'QILGAN SANA KO'RSATILMAYDI: u har qatorda
                    takrorlanib, jadvalni ikki qavatli qilib
                    qo'yardi — holbuki son hamma guruh uchun bir
                    vaqtda, 6 soatda bir marta yangilanadi, ya'ni
                    qatorlar orasida farq qilmaydi.
                  */}
                  <TableCell className="text-right">
                    {group.memberCount == null ? (
                      <span
                        className="text-sm text-muted-foreground"
                        title="Bot a'zolar sonini 6 soatda bir marta o'qiydi — hali o'qilmagan"
                      >
                        —
                      </span>
                    ) : (
                      <p className="tabular text-sm font-medium">
                        {formatPeople(group.memberCount)}
                      </p>
                    )}
                  </TableCell>

                  {/* ── Kuzatuv ─────────────────────────────── */}
                  <TableCell>
                    {can("groups.official") ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={group.isOfficial}
                          onCheckedChange={(checked) =>
                            setOfficial.mutate({
                              chatId: group.chatId,
                              isOfficial: checked,
                            })
                          }
                          // ⚠️ MFY YO'Q BO'LSA O'CHIRILGAN: server
                          // baribir rad etardi, lekin tugmani
                          // o'chirish SABABNI oldindan ko'rsatadi
                          // (yonidagi izoh bilan).
                          disabled={
                            setOfficial.isPending ||
                            (!group.isOfficial && !group.mahalla)
                          }
                          aria-label="Kuzatuv"
                        />
                        {!group.isOfficial && !group.mahalla ? (
                          <span className="text-xs text-muted-foreground">
                            Avval MFY
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <Badge
                        className={
                          group.isOfficial
                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                            : "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }
                      >
                        {group.isOfficial ? "Yoqilgan" : "O'chirilgan"}
                      </Badge>
                    )}
                  </TableCell>

                  {/* ── Qalqon ──────────────────────────────── */}
                  {/*
                    ⚠️ KUZATUVDAN ALOHIDA USTUN: `isOfficial` —
                    yozishmani O'QISHGA rozilik, qalqon esa
                    aholini himoya qiladi. Bitta ustunga
                    qo'shilsa, ular bir narsadek ko'rinardi.
                  */}
                  <TableCell>
                    {/*
                      ⚠️ KANALDA QALQON UMUMAN YO'Q: zararli
                      kontentni o'sha kanalning O'Z admini yozadi,
                      ya'ni o'chiriladigan begona xabar yo'q. Tugma
                      ko'rsatilsa, server uni rad etardi va xodim
                      "panel buzuq" deb o'ylardi; ko'rsatmay jim
                      bo'sh qoldirilsa esa "yuklanmadi" deb
                      o'ylardi — shuning uchun SABAB yoziladi.
                    */}
                    {group.isChannel ? (
                      <span
                        className="text-xs text-muted-foreground"
                        title="Kanalda postni kanalning o'z admini yozadi — o'chiriladigan begona xabar yo'q"
                      >
                        — Kanalga tegishli emas
                      </span>
                    ) : (
                      <div className="flex flex-col items-start gap-1">
                        {can("security.guard") ? (
                          <Switch
                            checked={group.guardEnabled}
                            onCheckedChange={(checked) =>
                              setGuard.mutate({
                                chatId: group.chatId,
                                guardEnabled: checked,
                              })
                            }
                            disabled={setGuard.isPending}
                            aria-label="Xavfsizlik qalqoni"
                          />
                        ) : (
                          <Badge
                            className={
                              group.guardEnabled
                                ? "bg-primary/10 text-primary dark:bg-primary/20"
                                : "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }
                          >
                            {group.guardEnabled ? "Yoqilgan" : "O'chirilgan"}
                          </Badge>
                        )}

                        {/*
                          ⚠️ "YOQILGAN, LEKIN ISHLAMAYDI" — ENG XAVFLI
                          HOLAT: ma'muriyat himoya bor deb o'ylaydi,
                          bot esa Telegram ruxsati yo'qligi uchun hech
                          narsa o'chira olmaydi — va guruhga
                          ogohlantirish ham YOZMAYDI. Ya'ni buni faqat
                          shu yorliq ko'rsatadi.
                        */}
                        {group.guardEnabled && !group.canDeleteMessages ? (
                          <Badge
                            className="bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200"
                            title="Botni guruhda administrator qiling va 'Xabarlarni o'chirish' huquqini bering"
                          >
                            Bot o&apos;chira olmaydi
                          </Badge>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {groups.data && groups.data.total > groups.data.limit ? (
        <div className="flex items-center justify-between pt-3">
          <p className="text-xs text-muted-foreground">
            {groups.data.total} ta chat · {groups.data.page}-sahifa
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={groups.data.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            >
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!groups.data.hasMore}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
            >
              Keyingi
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
