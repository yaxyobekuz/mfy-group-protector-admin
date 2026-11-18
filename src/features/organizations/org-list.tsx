"use client";

/**
 * TASHKILOTLAR RO'YXATI — REYESTR VA HISOBLAR.
 *
 * ⚠️ PAROL VA ULANISH KODI SAHIFADA ALOHIDA KO'RSATILADI, `toast` da
 * EMAS: xabar bir necha soniyada yo'qoladi va admin qiymatni
 * ko'chirib olishga ulgurmasdi — parol esa QAYTA so'rab bo'lmaydi
 * (bazada faqat hash saqlanadi).
 */

import { useState } from "react";
import { Building2, Copy, KeyRound, Link2, Pencil, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  useArchiveOrganization,
  useCreateOrgLogin,
  useCreateOrganization,
  useOrgLinkCode,
  useOrgUsers,
  useOrganizations,
  useResetOrgLogin,
  useUpdateOrganization,
} from "@/features/organizations/api";
import { useDistricts } from "@/features/territory/api";
import { ApiError } from "@/shared/api/client";
import type { Organization } from "@/shared/api/types";
import { formatDateUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input, Label } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CardSkeleton, EmptyState, ErrorState } from "@/shared/ui/states";

/** ⚠️ Radix `Select` bo'sh satrni qabul qilmaydi (`assignees` dagi ayni qoida). */
const PROVINCE = "__province__";

interface FormState {
  id: string | null;
  name: string;
  shortName: string;
  districtId: string;
  phone: string;
  address: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  shortName: "",
  districtId: PROVINCE,
  phone: "",
  address: "",
};

/**
 * ⚠️ NUSXA OLISH TUGMASI MAJBURIY: parol 12 belgili tasodifiy satr
 * va uni qo'lda ko'chirishda bitta harf xato bo'lsa, tashkilot
 * kirolmaydi — sabab esa hech qayerda ko'rinmasdi ("Login yoki
 * parol xato").
 */
const CopyRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-mono text-sm font-medium">{value}</p>
    </div>
    <Button
      variant="outline"
      size="sm"
      className="shrink-0"
      onClick={() => {
        void navigator.clipboard
          .writeText(value)
          .then(() => toast.success("Nusxa olindi"))
          .catch(() => toast.error("Nusxa olinmadi — qo'lda ko'chiring"));
      }}
    >
      <Copy className="size-3.5" />
    </Button>
  </div>
);

export const OrgList = ({ canManage }: { canManage: boolean }) => {
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [loginFor, setLoginFor] = useState<Organization | null>(null);

  /**
   * BIR MARTA KO'RSATILADIGAN SIRLAR.
   *
   * ⚠️ HOLATDA SAQLANADI, SO'ROV JAVOBIDAN QAYTA O'QILMAYDI: parol
   * faqat yaratish javobida keladi va `invalidateQueries` dan keyin
   * ro'yxat qayta yuklanganda u YO'Q. Holatda saqlanmasa, admin
   * sahifa yangilanishi bilan parolni yo'qotardi.
   */
  const [secret, setSecret] = useState<{
    title: string;
    username?: string;
    password?: string;
    linkCode?: string;
  } | null>(null);

  const districts = useDistricts();
  const organizations = useOrganizations({
    search: search.trim() || undefined,
    includeArchived: includeArchived || undefined,
  });

  const create = useCreateOrganization();
  const update = useUpdateOrganization();
  const archive = useArchiveOrganization();
  const linkCode = useOrgLinkCode();

  const submitForm = () => {
    if (!form) return;

    const payload = {
      name: form.name.trim(),
      shortName: form.shortName.trim() || undefined,
      districtId: form.districtId === PROVINCE ? undefined : form.districtId,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
    };

    if (form.id) {
      /**
       * ⚠️ TAHRIRLASHDA `null` YUBORILADI, `undefined` EMAS:
       * server `undefined` ni "tegmaslik" deb o'qiydi va bo'sh
       * qoldirilgan maydon eski qiymatida qolib ketardi — admin
       * esa "o'chirdim" deb o'ylab yurardi (serverdagi
       * `updateProfile` tuzog'i bilan ayni sabab).
       */
      update.mutate(
        {
          id: form.id,
          name: payload.name,
          shortName: payload.shortName ?? null,
          districtId: form.districtId === PROVINCE ? null : form.districtId,
          phone: payload.phone ?? null,
          address: payload.address ?? null,
        },
        { onSuccess: () => setForm(null) },
      );
      return;
    }

    create.mutate(payload, { onSuccess: () => setForm(null) });
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Label>Qidirish</Label>
          <Input
            value={search}
            placeholder="Tashkilot nomi"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Button
          variant={includeArchived ? "default" : "outline"}
          onClick={() => setIncludeArchived((prev) => !prev)}
        >
          Arxivlangalari
        </Button>

        {canManage ? (
          <Button className="ml-auto" onClick={() => setForm(EMPTY_FORM)}>
            <Plus className="size-4" /> Tashkilot qo&apos;shish
          </Button>
        ) : null}
      </div>

      {organizations.isLoading ? (
        <CardSkeleton count={4} />
      ) : organizations.isError ? (
        <ErrorState
          message={
            organizations.error instanceof ApiError
              ? organizations.error.message
              : undefined
          }
          onRetry={() => void organizations.refetch()}
        />
      ) : (organizations.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Building2}
          title="Tashkilot yo'q"
          hint="Murojaatlar tashkilotga yo'naltirilishi uchun avval tashkilotni qo'shing, so'ng Yo'naltirish bo'limida qoida qo'ying."
        />
      ) : (
        <div className="space-y-3">
          {organizations.data?.map((org) => (
            <Card key={org.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{org.name}</p>

                    {/*
                      ⚠️ "VILOYAT" ALOHIDA YORLIQ: bu tashkilot
                      tumani ko'rsatilmagani UCHUN emas, ATAYIN
                      viloyat darajasida ishlagani uchun shunday —
                      va u barcha tumanlar uchun zaxira bo'lib
                      ishlatiladi.
                    */}
                    <Badge className="bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {org.district?.name ?? "Butun viloyat"}
                    </Badge>

                    {org.isArchived ? (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200">
                        Arxivlangan
                      </Badge>
                    ) : !org.isActive ? (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                        Faol emas
                      </Badge>
                    ) : null}

                    {/*
                      ⚠️ "TELEGRAM ULANMAGAN" KO'RSATILADI: bunday
                      tashkilot xabarnoma OLMAYDI (xodimlarining
                      `telegramId` si bo'lmasa) va murojaat panelda
                      ko'rinmay, jim turib qolardi.
                    */}
                    {org.hasTelegram ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                        Telegram ulangan
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                        Telegram ulanmagan
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {org.shortName ? `${org.shortName} · ` : ""}
                    {org.phone ?? "telefon yo'q"}
                    {org.address ? ` · ${org.address}` : ""}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {org.routeCount} yo&apos;nalish · {org.userCount} hisob ·{" "}
                    {/*
                      ⚠️ SON — HAVOLA: "47 murojaat" degan raqam
                      o'zi hech narsa aytmaydi, xodimga esa
                      ularning RO'YXATI kerak ("qaysi biriga
                      javob bermagan"). Avval u Murojaatlar
                      bo'limiga o'tib, filtrni qo'lda tanlashi
                      kerak bo'lardi.
                    */}
                    <Link
                      href={`/issues?organizationId=${org.id}`}
                      className="text-primary hover:underline"
                    >
                      {org.issueCount} murojaat
                    </Link>{" "}
                    · {formatDateUz(org.createdAt)}
                  </p>

                  {org.pendingLinkCode ? (
                    <p className="mt-2 text-xs">
                      Ulanish kodi kutilmoqda:{" "}
                      <span className="font-mono font-medium">{org.pendingLinkCode}</span>{" "}
                      — tashkilot botga <span className="font-mono">/ulash {org.pendingLinkCode}</span> deb yozishi kerak.
                    </p>
                  ) : null}
                </div>

                {canManage ? (
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm({
                          id: org.id,
                          name: org.name,
                          shortName: org.shortName ?? "",
                          districtId: org.district?.id ?? PROVINCE,
                          phone: org.phone ?? "",
                          address: org.address ?? "",
                        })
                      }
                    >
                      <Pencil className="size-3.5" /> Tahrirlash
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => setLoginFor(org)}>
                      <KeyRound className="size-3.5" /> Hisoblar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={linkCode.isPending || org.isArchived}
                      onClick={() =>
                        linkCode.mutate(org.id, {
                          onSuccess: (result) =>
                            setSecret({
                              title: `${org.name} — Telegram ulanish kodi`,
                              linkCode: result.linkCode,
                            }),
                        })
                      }
                    >
                      <Link2 className="size-3.5" /> Telegram kodi
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={archive.isPending}
                      onClick={() =>
                        archive.mutate({ id: org.id, archived: !org.isArchived })
                      }
                    >
                      {org.isArchived ? "Qaytarish" : "Arxivlash"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── TASHKILOT YARATISH / TAHRIRLASH ─────────────────────── */}
      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form?.id ? "Tashkilotni tahrirlash" : "Yangi tashkilot"}
            </DialogTitle>
            <DialogDescription>
              Tuman tanlanmasa, tashkilot <strong>viloyat darajasida</strong> ishlaydi va
              tumani uchun alohida qoida qo&apos;yilmagan murojaatlarni oladi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Nomi</Label>
              <Input
                value={form?.name ?? ""}
                placeholder="Asaka tuman suv ta'minoti"
                onChange={(event) =>
                  setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                }
              />
            </div>

            <div>
              <Label>Qisqa nom</Label>
              <Input
                value={form?.shortName ?? ""}
                placeholder="Suvoqova"
                onChange={(event) =>
                  setForm((prev) =>
                    prev ? { ...prev, shortName: event.target.value } : prev,
                  )
                }
              />
              {/*
                ⚠️ QISQA NOM MUROJAATLAR RO'YXATIDA ISHLATILADI:
                "Andijon viloyat suv ta'minoti boshqarmasi" jadval
                ustuniga sig'maydi va qator ikkiga bo'linib,
                ro'yxat o'qilmaydigan bo'lib qolardi.
              */}
              <p className="mt-1 text-xs text-muted-foreground">
                Murojaatlar ro&apos;yxatida shu nom ko&apos;rinadi.
              </p>
            </div>

            <div>
              <Label>Tuman</Label>
              <Select
                value={form?.districtId ?? PROVINCE}
                onValueChange={(value) =>
                  setForm((prev) => (prev ? { ...prev, districtId: value } : prev))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PROVINCE}>Butun viloyat (zaxira)</SelectItem>
                  {districts.data?.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Telefon</Label>
              <Input
                value={form?.phone ?? ""}
                placeholder="+998 90 123 45 67"
                onChange={(event) =>
                  setForm((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
                }
              />
            </div>

            <div>
              <Label>Manzil</Label>
              <Input
                value={form?.address ?? ""}
                onChange={(event) =>
                  setForm((prev) =>
                    prev ? { ...prev, address: event.target.value } : prev,
                  )
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Bekor qilish
            </Button>
            <Button
              disabled={
                (form?.name.trim().length ?? 0) < 2 || create.isPending || update.isPending
              }
              onClick={submitForm}
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── HISOBLAR ─────────────────────────────────────────────── */}
      <OrgLoginsDialog
        org={loginFor}
        onClose={() => setLoginFor(null)}
        onSecret={setSecret}
      />

      {/* ── BIR MARTA KO'RSATILADIGAN SIR ────────────────────────── */}
      <Dialog open={secret !== null} onOpenChange={(open) => !open && setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{secret?.title}</DialogTitle>
            <DialogDescription>
              {secret?.password
                ? "Bu parol FAQAT SHU YERDA ko'rsatiladi — oynani yopgandan keyin uni qayta ko'rish mumkin emas, faqat yangisini yasash mumkin. Tashkilot birinchi kirishda parolni o'zi almashtiradi."
                : "Kod bir martalik: tashkilot botga yozgandan keyin ishlamaydi."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {secret?.username ? <CopyRow label="Login" value={secret.username} /> : null}
            {secret?.password ? <CopyRow label="Parol" value={secret.password} /> : null}
            {secret?.linkCode ? (
              <>
                <CopyRow label="Kod" value={secret.linkCode} />
                <CopyRow label="Botga yuboriladigan matn" value={`/ulash ${secret.linkCode}`} />
              </>
            ) : null}
          </div>

          <DialogFooter>
            <Button onClick={() => setSecret(null)}>Yozib oldim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * TASHKILOT HISOBLARI.
 *
 * ⚠️ ALOHIDA OYNA, RO'YXAT ICHIDA EMAS: hisoblar har tashkilot uchun
 * ALOHIDA so'rov bilan olinadi va ularni ro'yxat bilan birga
 * yuborish sahifaning birinchi ochilishini yuzlab hisobni kutishga
 * majbur qilardi (`coverage` sahifasidagi ayni qoida).
 */
const OrgLoginsDialog = ({
  org,
  onClose,
  onSecret,
}: {
  org: Organization | null;
  onClose: () => void;
  onSecret: (secret: {
    title: string;
    username?: string;
    password?: string;
  }) => void;
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const users = useOrgUsers(org?.id ?? "");
  const createLogin = useCreateOrgLogin();
  const reset = useResetOrgLogin();

  const reset3 = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
  };

  return (
    <Dialog open={org !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{org?.name} — hisoblar</DialogTitle>
          <DialogDescription>
            Hisob egasi panelda <strong>faqat o&apos;z tashkilotiga yo&apos;naltirilgan</strong>{" "}
            murojaatlarni ko&apos;radi. U ichki izoh yozadi va ishni{" "}
            <strong>«Bajarildi»</strong> deb belgilaydi; rasmiy javobni fuqaroga shtab
            xodimi yozadi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {(users.data?.length ?? 0) > 0 ? (
            <div className="space-y-1.5">
              {users.data?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {user.username}
                      {user.mustChangePassword ? " · parol almashtirilmagan" : ""}
                      {user.isArchived ? " · arxivlangan" : ""}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={reset.isPending || !org}
                    onClick={() =>
                      org &&
                      reset.mutate(
                        { id: org.id, userId: user.id },
                        {
                          onSuccess: (result) =>
                            onSecret({
                              title: `${user.firstName} ${user.lastName} — yangi parol`,
                              username: result.username,
                              password: result.password,
                            }),
                        },
                      )
                    }
                  >
                    <RotateCcw className="size-3.5" /> Parolni tiklash
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Hisob yo&apos;q. Tashkilot panelga kirishi uchun hisob yaratib, login va
              parolni unga bering.
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Ism</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>Familiya</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Yopish
          </Button>
          <Button
            disabled={
              !org ||
              firstName.trim().length < 2 ||
              lastName.trim().length < 2 ||
              createLogin.isPending
            }
            onClick={() =>
              org &&
              createLogin.mutate(
                {
                  id: org.id,
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  phone: phone.trim() || undefined,
                },
                {
                  onSuccess: (result) => {
                    reset3();
                    onSecret({
                      title: `${org.name} — yangi hisob`,
                      username: result.username,
                      password: result.password,
                    });
                  },
                },
              )
            }
          >
            <Plus className="size-4" /> Hisob yaratish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
