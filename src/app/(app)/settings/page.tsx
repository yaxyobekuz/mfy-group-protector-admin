"use client";

/**
 * SOZLAMALAR — tizim va yo'nalishlar.
 *
 * ⚠️ MODEL NOMI BU YERDA YO'Q va bo'lmaydi. U KODDA
 * (`server/src/modules/signals/ai/signal-ai.constants.ts`): model
 * almashtirish — kod o'zgarishi, u xulosaning sifatiga, narxiga va
 * javob shakliga ta'sir qiladi va review'dan o'tishi kerak.
 * Sozlamaga chiqarilsa, kimdir uni tasodifan almashtirib, butun
 * tahlil jim buzilishi mumkin edi.
 */

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  useAllCategories,
  useDeactivateCategory,
  useSaveCategory,
} from "@/features/issues/api";
import { useSaveSettings, useSettings } from "@/features/reports/api";
import { useSignalStatus } from "@/features/signals/api";
import type { IssueCategory, SignalSeverity } from "@/shared/api/types";
import { SIGNAL_SEVERITY } from "@/shared/config/labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input, Label, Textarea } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CATEGORY_ICONS } from "@/shared/config/category-icons";
import { Switch } from "@/shared/ui/switch";
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
import { PageHeader } from "@/widgets/page-header/page-header";

/**
 * Qatorlarga bo'lingan domen ro'yxatini massivga aylantiradi.
 *
 * ⚠️ `https://` OLIB TASHLANADI: foydalanuvchi to'liq havola
 * yopishtirishi tabiiy, lekin server FAQAT domen qabul qiladi
 * (taqqoslash domen bo'yicha) va u 400 bilan rad etardi.
 */
const toHostList = (value: string): string[] =>
  value
    .split("\n")
    .map((line) =>
      line
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, ""),
    )
    .filter(Boolean);

export default function SettingsPage() {
  const settings = useSettings();
  const status = useSignalStatus();
  const save = useSaveSettings();

  const [form, setForm] = useState({
    orgName: "",
    aiEnabled: true,
    aiIntervalMinutes: 30,
    aiMaxMessagesPerRun: 300,
    messageRetentionHours: 24,
    alertChatIds: "",
    alertMinSeverity: "high" as SignalSeverity,
    guardDeleteFiles: true,
    guardDeleteUrls: true,
    guardBlockedHosts: "",
    guardAllowedHosts: "",
    mobileEnabled: true,
    mobileAiClassify: true,
    mobileMaxAttachments: 5,
    mobileDailyLimit: 10,
  });

  /**
   * ⚠️ SERVER QIYMATI KELGANDA FORMA TO'LDIRILADI. `useState`
   * boshlang'ich qiymati bu yerda ishlamaydi: ma'lumot
   * ASINXRON keladi va birinchi renderda u hali yo'q.
   */
  useEffect(() => {
    const data = settings.data;
    if (!data) return;

    setForm({
      orgName: data.orgName,
      aiEnabled: data.aiEnabled,
      aiIntervalMinutes: data.aiIntervalMinutes,
      aiMaxMessagesPerRun: data.aiMaxMessagesPerRun,
      messageRetentionHours: data.messageRetentionHours,
      // ⚠️ MASSIV MATNGA aylantiriladi: bir nechta chat ID ni
      // kiritish uchun eng oddiy usul — har qatorga bittasi.
      alertChatIds: data.alertChatIds.join("\n"),
      alertMinSeverity: data.alertMinSeverity,
      guardDeleteFiles: data.guardDeleteFiles,
      guardDeleteUrls: data.guardDeleteUrls,
      guardBlockedHosts: data.guardBlockedHosts.join("\n"),
      guardAllowedHosts: data.guardAllowedHosts.join("\n"),
      mobileEnabled: data.mobileEnabled,
      mobileAiClassify: data.mobileAiClassify,
      mobileMaxAttachments: data.mobileMaxAttachments,
      mobileDailyLimit: data.mobileDailyLimit,
    });
  }, [settings.data]);

  if (settings.isLoading) return <CardSkeleton count={3} />;

  const handleSave = () => {
    save.mutate({
      orgName: form.orgName.trim(),
      aiEnabled: form.aiEnabled,
      aiIntervalMinutes: form.aiIntervalMinutes,
      aiMaxMessagesPerRun: form.aiMaxMessagesPerRun,
      messageRetentionHours: form.messageRetentionHours,
      // ⚠️ BO'SH QATORLAR TASHLANADI: foydalanuvchi oxirida
      // Enter bosib qo'yishi oddiy hol va bo'sh satr serverda
      // `@Matches(/^-?\d+$/)` da yiqilardi.
      alertChatIds: form.alertChatIds
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      alertMinSeverity: form.alertMinSeverity,

      guardDeleteFiles: form.guardDeleteFiles,
      guardDeleteUrls: form.guardDeleteUrls,
      // ⚠️ `alertChatIds` BILAN AYNI SABAB: bo'sh satr serverdagi
      // domen tekshiruvida (`@Matches`) yiqilardi.
      guardBlockedHosts: toHostList(form.guardBlockedHosts),
      guardAllowedHosts: toHostList(form.guardAllowedHosts),

      mobileEnabled: form.mobileEnabled,
      mobileAiClassify: form.mobileAiClassify,
      mobileMaxAttachments: form.mobileMaxAttachments,
      mobileDailyLimit: form.mobileDailyLimit,
    });
  };

  return (
    <>
      <PageHeader title="Sozlamalar" />

      <Tabs defaultValue="system">
        <TabsList>
          <TabsTrigger value="system">Tizim</TabsTrigger>
          <TabsTrigger value="categories">Yo&apos;nalishlar</TabsTrigger>
        </TabsList>

        {/* ══ TIZIM ════════════════════════════════════════════ */}
        <TabsContent value="system">
          <div className="grid max-w-2xl gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Umumiy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org">Tashkilot nomi</Label>
                  <Input
                    id="org"
                    value={form.orgName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, orgName: event.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── AI TAHLILI ──────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Guruh kuzatuvi (AI)</CardTitle>
                <CardDescription>
                  Rasmiy guruhlardagi xabarlarni tahlil qilish.
                  {status.data ? (
                    <>
                      {" "}
                      Hozirgi model: <code className="text-xs">{status.data.model}</code>
                    </>
                  ) : null}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/*
                  ⚠️ SERVERDA KALIT YO'Q BO'LSA ALOHIDA AYTILADI:
                  bu sozlama bilan tuzatilmaydi va foydalanuvchi
                  bayroqni yoqib, nima uchun ishlamayotganini
                  tushunmay qolardi.
                */}
                {status.data && !status.data.aiEnabled && form.aiEnabled ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs dark:border-amber-900 dark:bg-amber-950/30">
                    Serverda <code>OPENAI_API_KEY</code> qo&apos;yilmagan — bu
                    bayroqni yoqish yetarli emas.
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label>Tahlil yoqilgan</Label>
                    <p className="text-xs text-muted-foreground">
                      O&apos;chirilsa xabarlar to&apos;planib turadi, lekin tahlil
                      qilinmaydi.
                    </p>
                  </div>
                  <Switch
                    checked={form.aiEnabled}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, aiEnabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="interval">Tekshirish oralig&apos;i (daqiqa)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min={5}
                    max={1440}
                    value={form.aiIntervalMinutes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        aiIntervalMinutes: Number.parseInt(event.target.value, 10) || 30,
                      }))
                    }
                  />
                  {/*
                    ⚠️ NIMA UCHUN TEZ-TEZ YARAMASLIGI AYTILADI:
                    bitta so'rovga o'nlab xabar birga ketadi va
                    model SUHBATNI ko'radi. "Ha, bizda ham
                    shunday" degan gap yolg'iz o'zi ma'nosiz.
                  */}
                  <p className="text-xs text-muted-foreground">
                    Kamida 5 daqiqa. Tez-tez tekshirish qimmat va foydasiz: model bir
                    nechta xabarni birga ko&apos;rganda suhbatni tushunadi.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="max-msg">Bitta tekshiruvda eng ko&apos;p xabar</Label>
                  <Input
                    id="max-msg"
                    type="number"
                    min={10}
                    max={2000}
                    value={form.aiMaxMessagesPerRun}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        aiMaxMessagesPerRun:
                          Number.parseInt(event.target.value, 10) || 300,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Ortig&apos;i keyingi tekshiruvda ko&apos;riladi — navbat
                    yo&apos;qolmaydi.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="retention">
                    Xabarlar qancha saqlanadi (soat)
                  </Label>
                  <Input
                    id="retention"
                    type="number"
                    min={1}
                    max={720}
                    value={form.messageRetentionHours}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        messageRetentionHours:
                          Number.parseInt(event.target.value, 10) || 24,
                      }))
                    }
                  />
                  {/*
                    ⚠️ NIMA UCHUN O'CHIRILADI: bu aholining
                    yozishmasi va uni arxivlash kerak emas.
                    Signal esa qoladi — unga kerakli hamma narsa
                    ko'chirib olingan.
                  */}
                  <p className="text-xs text-muted-foreground">
                    Tahlildan keyin guruh xabarlari o&apos;chiriladi — bu aholining
                    yozishmasi. Signallar saqlanib qoladi.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ── XAVFSIZLIK QALQONI ──────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Xavfsizlik qalqoni</CardTitle>
                <CardDescription>
                  {/*
                    ⚠️ BU YERDA FAQAT "NIMANI ZARARLI DEYISH"
                    sozlanadi. Qalqonning O'ZI har guruhda alohida
                    yoqiladi (Telegram guruhlari bo'limi) — bitta
                    global tugma bilan hamma guruhda o'chirish
                    boshlanishi mumkin emas.
                  */}
                  Qalqon har guruhda alohida yoqiladi. Bu yerda faqat nima
                  zararli hisoblanishi belgilanadi.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="guard-files">O&apos;rnatma fayllarni o&apos;chirish</Label>
                    <p className="text-xs text-muted-foreground">
                      APK, EXE va shunga o&apos;xshash fayllar hamda arxivlar.
                    </p>
                  </div>
                  <Switch
                    id="guard-files"
                    checked={form.guardDeleteFiles}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, guardDeleteFiles: checked }))
                    }
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="guard-urls">Shubhali havolalarni o&apos;chirish</Label>
                    <p className="text-xs text-muted-foreground">
                      Qisqartirgichlar, yashirilgan manzillar va qora ro&apos;yxatdagi
                      domenlar.
                    </p>
                  </div>
                  <Switch
                    id="guard-urls"
                    checked={form.guardDeleteUrls}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, guardDeleteUrls: checked }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="allowed">Ruxsat etilgan domenlar</Label>
                  <Textarea
                    id="allowed"
                    value={form.guardAllowedHosts}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        guardAllowedHosts: event.target.value,
                      }))
                    }
                    placeholder={"gov.uz\nt.me"}
                    rows={3}
                  />
                  {/*
                    ⚠️ OQ RO'YXAT QORA RO'YXATDAN USTUN turishi
                    AYTILADI: aks holda ma'muriyat ikkalasiga
                    bitta domenni yozib, qaysi biri ishlashini
                    bilmay qolardi.
                  */}
                  <p className="text-xs text-muted-foreground">
                    Har qatorga bitta domen. Bu domenlar hech qachon
                    o&apos;chirilmaydi — qora ro&apos;yxatdan ustun turadi.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="blocked">Bloklangan domenlar</Label>
                  <Textarea
                    id="blocked"
                    value={form.guardBlockedHosts}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        guardBlockedHosts: event.target.value,
                      }))
                    }
                    placeholder={"evil.com\nfake-bank.net"}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Faqat domen (havola emas). Subdomenlar ham qamrab olinadi:
                    <code className="ml-1">evil.com</code> →{" "}
                    <code>sub.evil.com</code>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ── BILDIRISHNOMA ───────────────────────────────── */}
            {/* ── MOBIL ILOVA ─────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mobil ilova (fuqaro murojaati)</CardTitle>
                <CardDescription>
                  {/*
                    ⚠️ "O'CHIRISH" NIMANI ANGLATISHINI AYTISH
                    KERAK: operator uni "yangi murojaat qabul
                    qilinmaydi" deb emas, "ilova sekinlashadi" deb
                    tushunib bosib qo'yishi mumkin.
                  */}
                  Ilova o&apos;chirilsa fuqarolar yangi murojaat yubora olmaydi.
                  Yuborilganlari joyida qoladi.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="mobile-enabled">Ilova yoqilgan</Label>
                    <p className="text-xs text-muted-foreground">
                      O&apos;chirilsa fuqaroga &laquo;ilova vaqtincha
                      o&apos;chirilgan&raquo; deb ko&apos;rsatiladi.
                    </p>
                  </div>
                  <Switch
                    id="mobile-enabled"
                    checked={form.mobileEnabled}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, mobileEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="mobile-ai">AI yo&apos;nalish taklif qilsin</Label>
                    <p className="text-xs text-muted-foreground">
                      {/*
                        ⚠️ DOKTRINA EKRANDA AYTILADI: AI bu yerda
                        faqat TAKLIF qiladi va uni fuqaroning
                        O'ZI tasdiqlaydi — ya'ni "AI taxmini
                        rasmiy navbatga tekshirilmasdan tushmaydi"
                        qoidasi buzilmaydi.
                      */}
                      AI faqat taklif qiladi — yo&apos;nalishni fuqaroning
                      o&apos;zi tasdiqlaydi. O&apos;chirilsa oqim taklifsiz
                      davom etadi.
                    </p>
                  </div>
                  <Switch
                    id="mobile-ai"
                    checked={form.mobileAiClassify}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, mobileAiClassify: checked }))
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile-files">Bitta murojaatga fayl</Label>
                    <Input
                      id="mobile-files"
                      type="number"
                      min={1}
                      max={10}
                      value={form.mobileMaxAttachments}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          mobileMaxAttachments: Number(event.target.value),
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">Surat yoki video, 1–10.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mobile-limit">Kunlik chegara</Label>
                    <Input
                      id="mobile-limit"
                      type="number"
                      min={0}
                      max={200}
                      value={form.mobileDailyLimit}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          mobileDailyLimit: Number(event.target.value),
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {/*
                        ⚠️ CHEGARA BLOKLASHDAN YUMSHOQROQ CHORA
                        (`mobile.service.ts` izohi) va buni
                        operator bilishi kerak — aks holda u
                        darhol cheklashga o'tardi.
                      */}
                      Bitta fuqaro bir kunda nechta murojaat yubora oladi.
                      <strong className="font-medium"> 0 — cheksiz.</strong>{" "}
                      Cheklashdan yumshoqroq chora.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Telegram bildirishnomasi</CardTitle>
                <CardDescription>
                  Jiddiy signal chiqqanda belgilangan chatlarga xabar yuboriladi.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="chats">Chat ID lar</Label>
                  <Textarea
                    id="chats"
                    value={form.alertChatIds}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, alertChatIds: event.target.value }))
                    }
                    placeholder={"-1001234567890\n123456789"}
                    rows={4}
                  />
                  {/*
                    ⚠️ FORMAT AYTILADI: username ("@kanal") yozilsa
                    Telegram 400 qaytaradi va xato faqat server
                    logida ko'rinadi — xabar jimgina yetib
                    bormasdi. Server ham bu formatni tekshiradi.
                  */}
                  <p className="text-xs text-muted-foreground">
                    Har qatorga bittasi. Faqat raqam (va guruhlar uchun minus bilan) —
                    username yaramaydi. Bo&apos;sh qoldirilsa bildirishnoma
                    o&apos;chadi.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Qaysi darajadan boshlab</Label>
                  <Select
                    value={form.alertMinSeverity}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        alertMinSeverity: value as SignalSeverity,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SIGNAL_SEVERITY).map(([value, def]) => (
                        <SelectItem key={value} value={value}>
                          {def.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={save.isPending}>
                {save.isPending ? <Spinner /> : null}
                Saqlash
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ══ YO'NALISHLAR ═════════════════════════════════════ */}
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  YO'NALISHLAR
// ═══════════════════════════════════════════════════════════════════

const CategoriesTab = () => {
  const categories = useAllCategories();
  const deactivate = useDeactivateCategory();
  const [form, setForm] = useState<Partial<IssueCategory> | null>(null);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        {/*
          ⚠️ IZOH BOTGA BOG'LIQLIGINI AYTADI: yo'nalishlar botdagi
          klaviaturada tugma bo'lib ko'rinadi va ularning soni
          ko'payib ketsa, bot menyusi o'qilmaydigan bo'lib qoladi.
        */}
        <p className="text-sm text-muted-foreground">
          Yo&apos;nalishlar botda tugma sifatida ko&apos;rinadi — ularni kam va
          aniq saqlang.
        </p>

        <Button onClick={() => setForm({})}>
          <Plus className="size-4" />
          Qo&apos;shish
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {categories.isLoading ? (
          <CardSkeleton count={3} />
        ) : (categories.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="Yo'nalish yo'q"
            // ⚠️ OQIBAT AYTILADI: kategoriya bo'lmasa botdagi
            // "muammo yuborish" oqimi BOSHLANMAYDI.
            hint="Kamida bitta yo'nalish kerak — aks holda botdan muammo yuborish ishlamaydi."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Izoh</TableHead>
                <TableHead className="text-right">Murojaat</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {categories.data?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {category.color ? (
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      ) : null}
                      <span className="font-medium">{category.name}</span>
                      {!category.isActive ? (
                        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          O&apos;chirilgan
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {category.description ?? "—"}
                  </TableCell>

                  <TableCell className="tabular text-right text-sm">
                    {category.issueCount || "—"}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setForm(category)}
                        aria-label="Tahrirlash"
                      >
                        <Pencil className="size-3.5" />
                      </Button>

                      {category.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deactivate.mutate(category.id)}
                          disabled={deactivate.isPending}
                          aria-label="O'chirish"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {form ? <CategoryDialog initial={form} onClose={() => setForm(null)} /> : null}
    </>
  );
};

const CategoryDialog = ({
  initial,
  onClose,
}: {
  initial: Partial<IssueCategory>;
  onClose: () => void;
}) => {
  const save = useSaveCategory();

  const [name, setName] = useState(initial.name ?? "");
  const [color, setColor] = useState(initial.color ?? "#2563eb");
  const [description, setDescription] = useState(initial.description ?? "");
  const [isActive, setActive] = useState(initial.isActive ?? true);

  // ── MOBIL ILOVA MAYDONLARI ────────────────────────────────────
  const [icon, setIcon] = useState(initial.icon ?? "more");
  const [slaHours, setSlaHours] = useState(initial.slaHours ?? 72);
  const [orgName, setOrgName] = useState(initial.orgName ?? "");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial.id ? "Yo'nalishni tahrirlash" : "Yo'nalish qo'shish"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Nomi *</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Kommunal xizmatlar"
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-color">Rang</Label>
            <div className="flex items-center gap-2">
              <Input
                id="c-color"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-9 w-16 p-1"
              />
              <Input
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Izoh</Label>
            <Textarea
              id="c-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={400}
              rows={2}
            />
          </div>

          {/* ── MOBIL ILOVA ──────────────────────────────── */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Mobil ilova</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {/*
                  ⚠️ ILOVA UCHUN ALOHIDA YO'NALISHLAR OCHILMAYDI
                  (`prisma/seed.ts` izohi): ilovadagi ro'yxat —
                  AYNAN shu ro'yxat. Operator buni bilishi kerak,
                  aks holda u "ilova uchun" takroriy yo'nalishlar
                  ochib yuborardi.
                */}
                Bu yo&apos;nalish ilovada ham shu nom bilan ko&apos;rinadi.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-icon">Belgi</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger id="c-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ICONS.map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ilovadagi ro&apos;yxatda ko&apos;rinadi.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-sla">Javob muddati (soat)</Label>
                <Input
                  id="c-sla"
                  type="number"
                  min={1}
                  max={720}
                  value={slaHours}
                  onChange={(event) => setSlaHours(Number(event.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  {/*
                    ⚠️ MUDDAT — MO'LJAL, MAJBURIYAT EMAS
                    (`Issue.dueAt` qoidasi): tizim u o'tganda hech
                    narsa qilmaydi.
                  */}
                  Fuqaroga ko&apos;rsatiladi. Mo&apos;ljal — tizim uni
                  o&apos;tganda hech narsa qilmaydi.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-org">Mas&apos;ul tashkilot</Label>
              <Input
                id="c-org"
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                placeholder="Obodonlashtirish va chiqindi xizmatlari"
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                Fuqaroga &laquo;murojaatingiz kimga ketdi&raquo; deb ko&apos;rsatiladi.
              </p>
            </div>
          </div>

          {initial.id ? (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Faol</Label>
                <p className="text-xs text-muted-foreground">
                  O&apos;chirilsa botda ko&apos;rinmaydi, lekin eski murojaatlar
                  saqlanadi.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setActive} />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Bekor qilish
          </Button>
          <Button
            disabled={name.trim().length < 2 || save.isPending}
            onClick={() =>
              save.mutate(
                {
                  id: initial.id,
                  name: name.trim(),
                  color,
                  description: description.trim() || undefined,
                  isActive: initial.id ? isActive : undefined,
                  icon,
                  slaHours,
                  // ⚠️ BO'SH SATR `null` GA AYLANTIRILADI: server
                  // uni "ko'rsatilmagan" deb oladi va ilova
                  // zahira matnni ("Viloyat shtabi") chiqaradi.
                  orgName: orgName.trim() || null,
                },
                { onSuccess: onClose },
              )
            }
          >
            {save.isPending ? <Spinner /> : null}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
