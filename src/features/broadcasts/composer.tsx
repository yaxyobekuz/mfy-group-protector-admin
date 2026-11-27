"use client";

/**
 * TARQATMA YIG'UVCHI — AUDITORIYA, MAZMUN, SOZLAMALAR.
 *
 * ⚠️ ALOHIDA KOMPONENT: sahifaning o'zida ro'yxat, tafsilot va
 * jurnal ham bor va hammasi bitta faylda bo'lsa, u ming qatordan
 * oshib, qaysi holat qaysi blokka tegishli ekanini topib
 * bo'lmasdi.
 *
 * ⚠️ HAR O'ZGARISHDA AUDITORIYA QAYTA SANALADI: "1 240 kishiga
 * yuboriladi" degan son hudud noto'g'ri tanlanganini TO'XTATADI.
 * Guruhga yuborilgan xabarni o'chirib bo'lmaydi va u yuzlab
 * odamning ko'z o'ngida turadi.
 */

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Link2,
  Megaphone,
  Pin,
  Plus,
  Send,
  TestTube2,
  Trash2,
  VolumeX,
} from "lucide-react";

import {
  useAudienceSize,
  useSendBroadcast,
  useTestBroadcast,
  type BroadcastInput,
} from "@/features/broadcasts/api";
import { useDistricts, useMahallas } from "@/features/territory/api";
import type {
  BroadcastAudience,
  BroadcastButton,
  BroadcastMode,
} from "@/shared/api/types";
import { AUDIENCE_HINTS, AUDIENCE_LABELS } from "@/shared/config/labels";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input, Label, Textarea } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/states";
import { Switch } from "@/shared/ui/switch";

const ALL = "__all__";
const MESSAGE_MAX = 4000;

/**
 * ⚠️ PANELDAN FAQAT MATN: `forward`/`copy` Telegram'dan
 * `(from_chat_id, message_id)` juftligini talab qiladi va u
 * adminning SHAXSIY CHATI — ya'ni uni faqat botdan berish mumkin
 * (doktrina: "uzatilgan xabar faqat botdan").
 */
const PANEL_MODE: BroadcastMode = "text";

/**
 * ⚠️ `chats` RO'YXATDA YO'Q: u qayta yuborishda AVTOMATIK
 * tanlanadi va qo'lda tanlansa, operator chat id'larini qo'lda
 * yozishi kerak bo'lardi.
 */
const AUDIENCES: BroadcastAudience[] = [
  "citizens",
  "citizens_active",
  "groups",
  "channels",
  "both",
  "all",
];

/** Auditoriyada chat (guruh/kanal) bormi — qadash shunga bog'liq. */
const hasChats = (audience: BroadcastAudience): boolean =>
  audience !== "citizens" && audience !== "citizens_active";

export const BroadcastComposer = () => {
  const [audience, setAudience] = useState<BroadcastAudience>("citizens");
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [mahallaId, setMahallaId] = useState<string | null>(null);
  const [activeDays, setActiveDays] = useState(30);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [buttons, setButtons] = useState<BroadcastButton[]>([]);
  const [silent, setSilent] = useState(false);
  const [pinMessage, setPinMessage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const [confirming, setConfirming] = useState(false);

  const districts = useDistricts();
  const mahallas = useMahallas(districtId ? { districtId } : {});

  const send = useSendBroadcast();
  const test = useTestBroadcast();

  const target = useMemo(
    () => ({
      audience,
      districtId: districtId ?? undefined,
      mahallaId: mahallaId ?? undefined,
      activeDays: audience === "citizens_active" ? activeDays : undefined,
    }),
    [audience, districtId, mahallaId, activeDays],
  );

  const size = useAudienceSize(target);

  const trimmed = message.trim();
  const canSend = trimmed.length >= 3 && (size.data?.total ?? 0) > 0;

  const input: BroadcastInput = {
    ...target,
    mode: PANEL_MODE,
    title: title.trim() || undefined,
    message: trimmed,
    buttons: buttons.filter((button) => button.text.trim() && button.url.trim()),
    silent,
    pinMessage: hasChats(audience) ? pinMessage : false,
    disablePreview: !showPreview,
    /**
     * ⚠️ MAHALLIY VAQT ISO GA O'GIRILADI: `datetime-local` zonasiz
     * satr beradi va uni to'g'ridan-to'g'ri yuborish serverda
     * UTC deb o'qilardi — ya'ni e'lon besh soat kechikardi.
     */
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
  };

  const reset = () => {
    setTitle("");
    setMessage("");
    setButtons([]);
    setScheduledAt("");
    setSilent(false);
    setPinMessage(false);
    setShowPreview(false);
    setConfirming(false);
  };

  const submit = () => {
    send.mutate(input, { onSuccess: reset });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="size-4 text-muted-foreground" />
          Yangi tarqatma
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ══ AUDITORIYA ══════════════════════════════════════ */}
        <div className="space-y-2">
          <Label>Kimga</Label>

          {/*
            ⚠️ TUGMALAR, DROPDOWN EMAS: auditoriya — tarqatmaning
            ENG XAVFLI tanlovi (kanalga yuborilgan xabarni o'chirib
            bo'lmaydi) va u ro'yxat ichiga yashirilsa, operator uni
            o'qimasdan o'tib ketardi.
          */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAudience(value)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left transition",
                  audience === value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-secondary",
                )}
              >
                <span className="block text-sm font-medium">
                  {AUDIENCE_LABELS[value]}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {AUDIENCE_HINTS[value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {audience === "citizens_active" ? (
          <div className="space-y-1.5">
            <Label htmlFor="active-days">Oxirgi necha kun ichida faol</Label>
            <Input
              id="active-days"
              type="number"
              min={1}
              max={365}
              value={activeDays}
              onChange={(event) => setActiveDays(Number(event.target.value) || 30)}
              className="w-32"
            />
          </div>
        ) : null}

        {/* ══ HUDUD ══════════════════════════════════════════ */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tuman</Label>
            <Select
              value={districtId ?? ALL}
              onValueChange={(value) => {
                setDistrictId(value === ALL ? null : value);
                // ⚠️ MFY TOZALANADI: eski tanlov yangi tumanga
                // tegishli bo'lmasligi mumkin va server uni rad
                // etardi — operator sababini tushunmasdi.
                setMahallaId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Butun viloyat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Butun viloyat</SelectItem>
                {districts.data?.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>MFY</Label>
            <Select
              value={mahallaId ?? ALL}
              onValueChange={(value) => setMahallaId(value === ALL ? null : value)}
              disabled={!districtId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Hammasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Hammasi</SelectItem>
                {mahallas.data?.map((mahalla) => (
                  <SelectItem key={mahalla.id} value={mahalla.id}>
                    {mahalla.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ══ AUDITORIYA HAJMI ═══════════════════════════════ */}
        {/*
          ⚠️ YUBORISHDAN OLDIN KO'RSATILADI: "1 240 kishiga
          yuboriladi" degan son hudud noto'g'ri tanlanganini
          to'xtatadi. Usiz xato faqat yuborilgandan keyin bilinardi.
        */}
        <div className="rounded-xl bg-secondary/60 px-3.5 py-3">
          {size.isLoading ? (
            <p className="text-sm text-muted-foreground">Hisoblanmoqda…</p>
          ) : size.data ? (
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <span className="metric text-2xl font-semibold">
                {size.data.total}
              </span>
              <span className="text-sm text-muted-foreground">ta manzil</span>
              {size.data.citizens > 0 ? (
                <span className="text-xs text-muted-foreground">
                  fuqaro: {size.data.citizens}
                </span>
              ) : null}
              {size.data.groups > 0 ? (
                <span className="text-xs text-muted-foreground">
                  guruh: {size.data.groups}
                </span>
              ) : null}
              {size.data.channels > 0 ? (
                <span className="text-xs text-muted-foreground">
                  kanal: {size.data.channels}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Auditoriya aniqlanmadi</p>
          )}
        </div>

        {/* ══ MAZMUN ═════════════════════════════════════════ */}
        <div className="space-y-1.5">
          <Label htmlFor="broadcast-title">Sarlavha (faqat panelda ko‘rinadi)</Label>
          <Input
            id="broadcast-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Masalan: Suv o'chishi haqida ogohlantirish"
            maxLength={120}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="broadcast-text">Xabar matni</Label>
            <span
              className={cn(
                "tabular text-xs",
                trimmed.length > MESSAGE_MAX
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {trimmed.length} / {MESSAGE_MAX}
            </span>
          </div>
          <Textarea
            id="broadcast-text"
            rows={7}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Fuqarolarga yetkaziladigan xabar…"
          />
        </div>

        {/* ══ TUGMALAR ═══════════════════════════════════════ */}
        {/*
          ⚠️ UCHTADAN KO'P EMAS: tugmalar bitta ustunda chiziladi
          va telefonda xabarning o'zidan uzun bo'lib ketardi.

          ⚠️ FAQAT HAVOLALI: bosilganda botga hodisa yuboradigan
          tugma uchun ishlovchi kod kerak bo'lardi — aks holda
          tugma bosiladi-yu, hech narsa bo'lmaydi.
        */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Tugmalar</Label>
            {buttons.length < 3 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setButtons((prev) => [...prev, { text: "", url: "" }])}
              >
                <Plus className="size-3.5" />
                Qo&apos;shish
              </Button>
            ) : null}
          </div>

          {buttons.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Xabar ostida havolali tugma chiqadi — masalan «Batafsil»
            </p>
          ) : (
            <div className="space-y-2">
              {buttons.map((button, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={button.text}
                    onChange={(event) =>
                      setButtons((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, text: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="Tugma matni"
                    maxLength={48}
                    className="w-40 shrink-0"
                  />
                  <Input
                    value={button.url}
                    onChange={(event) =>
                      setButtons((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, url: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="https://…"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setButtons((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ SOZLAMALAR ═════════════════════════════════════ */}
        <div className="space-y-3 rounded-xl border border-border p-3.5">
          <Option
            icon={VolumeX}
            label="Ovozsiz yuborish"
            hint="Bildirishnoma kelmaydi — tungi xabar uchun"
            checked={silent}
            onChange={setSilent}
          />

          <Option
            icon={Link2}
            label="Havola ko'rinishi"
            hint="Matndagi havolaning surati va tavsifi chiqadi"
            checked={showPreview}
            onChange={setShowPreview}
          />

          {/*
            ⚠️ QADASH FAQAT CHAT AUDITORIYASIDA: shaxsiy chatda
            Telegram uni rad etadi va hisobotda yolg'on "xato"
            paydo bo'lardi.
          */}
          {hasChats(audience) ? (
            <Option
              icon={Pin}
              label="Guruh va kanalda qadash"
              hint="Xabar chat tepasiga mahkamlanadi"
              checked={pinMessage}
              onChange={setPinMessage}
            />
          ) : null}
        </div>

        {/* ══ REJALASHTIRISH ═════════════════════════════════ */}
        <div className="space-y-1.5">
          <Label htmlFor="broadcast-when" className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5 text-muted-foreground" />
            Qachon yuborilsin
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="broadcast-when"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="w-56"
            />
            {scheduledAt ? (
              <Button variant="outline" size="sm" onClick={() => setScheduledAt("")}>
                Hoziroq yuborish
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Bo&apos;sh bo&apos;lsa — hoziroq
              </span>
            )}
          </div>
        </div>

        {/* ══ AMALLAR ════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {/*
            ⚠️ SINOV TUGMASI YUBORISHDAN CHAPDA: guruhga yuborilgan
            xabarni o'chirib bo'lmaydi va uning qanday ko'rinishini
            (tugmalar, havola, formatlash) OLDIN ko'rish kerak.
          */}
          <Button
            variant="outline"
            disabled={trimmed.length < 3 || test.isPending}
            onClick={() => test.mutate(input)}
          >
            {test.isPending ? <Spinner /> : <TestTube2 className="size-4" />}
            O&apos;zimga sinov
          </Button>

          {confirming ? (
            <>
              <Button disabled={send.isPending} onClick={submit}>
                {send.isPending ? <Spinner /> : <Send className="size-4" />}
                Ha, {size.data?.total ?? 0} ta manzilga yuborilsin
              </Button>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Bekor qilish
              </Button>
            </>
          ) : (
            <Button disabled={!canSend} onClick={() => setConfirming(true)}>
              <Send className="size-4" />
              {scheduledAt ? "Rejalashtirish" : "Yuborish"}
            </Button>
          )}
        </div>

        {/*
          ⚠️ TASDIQLASH MATNI AUDITORIYANI TAKRORLAYDI: tugmadagi
          son bilan birga u "nimaga rozilik berayapman" degan
          savolga to'liq javob beradi — bosilgandan keyin
          qaytarib bo'lmaydi.
        */}
        {confirming ? (
          <p className="text-xs text-muted-foreground">
            Yuborilgan xabarni o&apos;chirib bo&apos;lmaydi.{" "}
            {AUDIENCE_LABELS[audience]}
            {size.data?.channels ? " — kanallar ham kiradi" : ""}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

/** Yoqish/o'chirish qatori — belgi, nom va izoh bilan. */
const Option = ({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: typeof Pin;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);
