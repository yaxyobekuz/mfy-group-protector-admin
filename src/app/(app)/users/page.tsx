"use client";

/**
 * XODIMLAR — ruxsat va hududiy qamrov.
 *
 * ⚠️ IKKI ALOHIDA TUSHUNCHA va forma ularni AJRATIB ko'rsatadi:
 *
 *   ruxsat (permissions)  — NIMA QILA OLADI
 *   qamrov (scopeKind)    — KIMNING MA'LUMOTINI KO'RADI
 *
 * Ularni aralashtirish eng ko'p uchraydigan xato: tuman
 * operatoriga `signals.attach` ruxsati beriladi, lekin u faqat o'z
 * tumanidagi signalni biriktira oladi. Shuning uchun forma ikkisini
 * alohida bo'limda ko'rsatadi.
 */

import { useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, UserMinus, UserPlus } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useArchiveUser,
  usePermissionCatalog,
  useResetPassword,
  useSaveUser,
  useUsers,
  type UserFilters,
} from "@/features/users/api";
import { useDistricts } from "@/features/territory/api";
import { ApiError } from "@/shared/api/client";
import type { ScopeKind, StaffUser, UserRole } from "@/shared/api/types";
import { SCOPE_KIND, USER_ROLE } from "@/shared/config/labels";
import { formatRelativeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FieldError, Input, Label } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { EmptyState, ErrorState, Spinner, TableSkeleton } from "@/shared/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { PageHeader } from "@/widgets/page-header/page-header";

const ALL = "__all__";

export default function UsersPage() {
  const { can } = useSession();

  const [filters, setFilters] = useState<UserFilters>({
    includeArchived: false,
    page: 1,
    limit: 50,
  });

  const [form, setForm] = useState<Partial<StaffUser> | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<StaffUser | null>(null);

  const users = useUsers(filters);
  const districts = useDistricts();
  const archive = useArchiveUser();

  const canManage = can("users.manage");

  return (
    <>
      <PageHeader
        title="Adminlar"
        actions={
          canManage ? (
            <Button onClick={() => setForm({})}>
              <Plus className="size-4" />
              Admin qo&apos;shish
            </Button>
          ) : null
        }
      />

      {/* ── Filtrlar ─────────────────────────────────────────── */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Ism yoki login..."
          value={filters.search ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              search: event.target.value || undefined,
              page: 1,
            }))
          }
        />

        <Select
          value={filters.role ?? ALL}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              role: value === ALL ? undefined : (value as UserRole),
              page: 1,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha rollar</SelectItem>
            {Object.entries(USER_ROLE).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.districtId ?? ALL}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              districtId: value === ALL ? undefined : value,
              page: 1,
            }))
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

        <Button
          variant={filters.includeArchived ? "default" : "outline"}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              includeArchived: !prev.includeArchived,
              page: 1,
            }))
          }
        >
          Arxivdagilar ham
        </Button>
      </div>

      {/* ── Jadval ───────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        {users.isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : users.isError ? (
          <ErrorState
            message={users.error instanceof ApiError ? users.error.message : undefined}
            onRetry={() => void users.refetch()}
          />
        ) : (users.data?.items.length ?? 0) === 0 ? (
          <EmptyState title="Admin topilmadi" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Qamrov</TableHead>
                <TableHead className="text-right">Topshiriq</TableHead>
                <TableHead>Oxirgi kirish</TableHead>
                {canManage ? <TableHead /> : null}
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.data?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.isArchived ? (
                          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Arxiv
                          </Badge>
                        ) : !user.isActive ? (
                          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Nofaol
                          </Badge>
                        ) : null}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        <code>{user.username}</code>
                        {user.phone ? ` · ${user.phone}` : null}
                        {/* ⚠️ TELEGRAM BOG'LANGANI KO'RSATILADI: u
                            botdan muammo yuborishi uchun KERAK va
                            bog'lanmagan xodim buni qila olmaydi. */}
                        {user.telegramId ? " · Telegram bog'langan" : null}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">{USER_ROLE[user.role]}</TableCell>

                  <TableCell className="text-sm">
                    <div>
                      <p>{SCOPE_KIND[user.scopeKind]}</p>
                      {user.scopeKind === "district" ? (
                        <p className="text-xs text-muted-foreground">
                          {/*
                            ⚠️ TUMAN KO'RSATILMAGAN BO'LSA
                            OGOHLANTIRISH: bunday xodim HECH NARSA
                            ko'rmaydi (server `impossible` filtri
                            qo'yadi) va u buni o'zi tushuntirib bera
                            olmasdi.
                          */}
                          {user.district?.name ?? (
                            <span className="text-destructive">
                              Tuman tanlanmagan — hech narsa ko&apos;rmaydi
                            </span>
                          )}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="tabular text-right text-sm">
                    {user._count.assignedIssues || "—"}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLoginAt ? formatRelativeUz(user.lastLoginAt) : "—"}
                  </TableCell>

                  {canManage ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* ⚠️ `owner` NI TAHRIRLAB BO'LMAYDI: admin
                            uning ruxsatini olib tashlab, tizimni
                            egasiz qoldirishi mumkin bo'lardi. */}
                        {user.role !== "owner" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setForm(user)}
                              aria-label="Tahrirlash"
                            >
                              <Pencil className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPasswordTarget(user)}
                              aria-label="Parolni almashtirish"
                            >
                              <KeyRound className="size-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                archive.mutate({
                                  id: user.id,
                                  archived: !user.isArchived,
                                })
                              }
                              disabled={archive.isPending}
                              aria-label={
                                user.isArchived ? "Arxivdan qaytarish" : "Arxivlash"
                              }
                            >
                              {user.isArchived ? (
                                <UserPlus className="size-3.5" />
                              ) : (
                                <UserMinus className="size-3.5" />
                              )}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {form ? <UserDialog initial={form} onClose={() => setForm(null)} /> : null}

      {passwordTarget ? (
        <PasswordDialog
          user={passwordTarget}
          onClose={() => setPasswordTarget(null)}
        />
      ) : null}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  XODIM OYNASI
// ═══════════════════════════════════════════════════════════════════

const UserDialog = ({
  initial,
  onClose,
}: {
  initial: Partial<StaffUser>;
  onClose: () => void;
}) => {
  const save = useSaveUser();
  const catalog = usePermissionCatalog();
  const districts = useDistricts();
  const { isProvinceWide } = useSession();

  const isEdit = Boolean(initial.id);

  const [username, setUsername] = useState(initial.username ?? "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(initial.firstName ?? "");
  const [lastName, setLastName] = useState(initial.lastName ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [telegramId, setTelegramId] = useState(initial.telegramId ?? "");
  const [role, setRole] = useState<UserRole>(initial.role ?? "operator");
  const [scopeKind, setScopeKind] = useState<ScopeKind>(
    initial.scopeKind ?? "district",
  );
  const [districtId, setDistrictId] = useState(initial.district?.id ?? "");
  const [permissions, setPermissions] = useState<string[]>(initial.permissions ?? []);
  const [isActive, setActive] = useState(initial.isActive ?? true);

  /**
   * ROL O'ZGARGANDA RUXSATLAR TAKLIF QILINADI.
   *
   * ⚠️ FAQAT YANGI XODIMDA: tahrirlashda xodimning ruxsatlari
   * QO'LDA sozlangan bo'lishi mumkin ("bu operatorga qo'shimcha
   * bitta huquq kerak") va rolni almashtirish ularni jimgina
   * yo'q qilardi.
   */
  useEffect(() => {
    if (isEdit) return;

    const defaults = catalog.data?.roleDefaults[role];
    if (defaults) setPermissions(defaults);
  }, [role, isEdit, catalog.data]);

  const toggle = (key: string) =>
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );

  const isValid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    (isEdit || (username.trim().length >= 3 && password.length >= 6)) &&
    // ⚠️ `district` QAMROVDA TUMAN MAJBURIY: aks holda xodim HECH
    // NARSA ko'rmaydi. Server ham bunga ruxsat bermaydi.
    (scopeKind === "province" || districtId.length > 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Adminni tahrirlash" : "Admin qo'shish"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* ── Shaxs ─────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="u-first">Ism *</Label>
              <Input
                id="u-first"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-last">Familiya *</Label>
              <Input
                id="u-last"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>

          {!isEdit ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="u-login">Login *</Label>
                <Input
                  id="u-login"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                  placeholder="a.valiyev"
                />
                {/* ⚠️ FORMAT AYTILADI: server faqat kichik harf,
                    raqam, nuqta va `_` ni qabul qiladi (login
                    URL va log'da ishlatiladi). */}
                <p className="text-xs text-muted-foreground">
                  Kichik harf, raqam, nuqta va pastki chiziq.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-pass">Parol *</Label>
                <Input
                  id="u-pass"
                  type="text"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Kamida 6 belgi.</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="u-phone">Telefon</Label>
              <Input
                id="u-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-tg">Telegram ID</Label>
              <Input
                id="u-tg"
                value={telegramId}
                onChange={(event) => setTelegramId(event.target.value)}
                placeholder="123456789"
              />
              {/*
                ⚠️ QAYERDAN OLISHNI AYTADI: xodim o'z Telegram
                id'sini bilmaydi va bot `/start` da uni
                KO'RSATADI. Buni yozmasa, maydon hech qachon
                to'ldirilmasdi.
              */}
              <p className="text-xs text-muted-foreground">
                Admin botda /start bosganda raqam ko&apos;rinadi. Botdan muammo
                yuborishi uchun kerak.
              </p>
            </div>
          </div>

          {/* ── Rol ──────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* ⚠️ `owner` RO'YXATDA YO'Q: u faqat seed bilan
                    yaratiladi (server ham rad etadi). */}
                {Object.entries(USER_ROLE)
                  .filter(([value]) => value !== "owner")
                  .map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Rol faqat boshlang&apos;ich ruxsatlarni taklif qiladi — keyin ularni
              alohida sozlash mumkin.
            </p>
          </div>

          {/* ── QAMROV (ruxsatdan ALOHIDA) ───────────────────── */}
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Hududiy qamrov</p>
              <p className="text-xs text-muted-foreground">
                Admin <strong>kimning</strong> ma&apos;lumotini ko&apos;radi. Bu
                ruxsatdan alohida: tuman operatori signalni biriktira oladi, lekin
                faqat o&apos;z tumanidagini.
              </p>
            </div>

            <Select
              value={scopeKind}
              onValueChange={(value) => setScopeKind(value as ScopeKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* ⚠️ TUMAN XODIMI VILOYAT QAMROVINI BERA
                    OLMAYDI: u o'ziga cheksiz qamrovli hisob ochib,
                    qamrovdan chiqib ketardi. Server ham rad etadi. */}
                <SelectItem value="district">{SCOPE_KIND.district}</SelectItem>
                {isProvinceWide ? (
                  <SelectItem value="province">{SCOPE_KIND.province}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>

            {scopeKind === "district" ? (
              <div className="space-y-1.5">
                <Label>Tuman *</Label>
                <Select value={districtId} onValueChange={setDistrictId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.data?.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!districtId ? (
                  <FieldError message="Tuman tanlanmasa admin hech narsa ko'rmaydi." />
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ── RUXSATLAR ────────────────────────────────────── */}
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Ruxsatlar</p>
              <p className="text-xs text-muted-foreground">
                Admin <strong>nimani</strong> qila oladi.
              </p>
            </div>

            {catalog.isLoading ? (
              <Spinner className="text-muted-foreground" />
            ) : (
              <div className="space-y-4">
                {catalog.data?.groups.map((group) => (
                  <div key={group.key} className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>

                    <div className="space-y-1.5">
                      {group.items.map((item) => (
                        <label
                          key={item.key}
                          className="flex cursor-pointer items-start gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={permissions.includes(item.key)}
                            onChange={() => toggle(item.key)}
                            className="mt-0.5 size-4 shrink-0 rounded border-input"
                          />
                          <span>
                            {item.label}
                            {/*
                              ⚠️ `hint` KO'RSATILADI va u SERVERDAN
                              keladi: sezgir ruxsatlarning oqibati
                              ("bu belgi — guruh yozishmasini
                              o'qishga rozilik") shu yerda
                              aytiladi. Panelda nusxa saqlansa, u
                              eskirardi.
                            */}
                            {item.hint ? (
                              <span className="block text-xs text-muted-foreground">
                                {item.hint}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isEdit ? (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Faol</Label>
                <p className="text-xs text-muted-foreground">
                  O&apos;chirilsa tizimga kira olmaydi.
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
            disabled={!isValid || save.isPending}
            onClick={() =>
              save.mutate(
                {
                  id: initial.id,
                  username: isEdit ? undefined : username.trim(),
                  password: isEdit ? undefined : password,
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  phone: phone.trim() || undefined,
                  role,
                  scopeKind,
                  districtId: scopeKind === "district" ? districtId : null,
                  permissions,
                  telegramId: telegramId.trim() || null,
                  isActive: isEdit ? isActive : undefined,
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

// ═══════════════════════════════════════════════════════════════════
//  PAROL OYNASI
// ═══════════════════════════════════════════════════════════════════

const PasswordDialog = ({
  user,
  onClose,
}: {
  user: StaffUser;
  onClose: () => void;
}) => {
  const reset = useResetPassword();
  const [password, setPassword] = useState("");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parolni almashtirish</DialogTitle>
          <DialogDescription>
            {user.firstName} {user.lastName} (<code>{user.username}</code>)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="new-pass">Yangi parol</Label>
          <Input
            id="new-pass"
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
          {/*
            ⚠️ OQIBAT AYTILADI: barcha sessiyalar yopiladi. Parol
            almashtirishning sababi ko'pincha "parol tarqalgan"
            bo'ladi va bu — kutilgan natija, lekin u xodimni
            ish o'rtasida tizimdan chiqaradi.
          */}
          <p className="text-xs text-muted-foreground">
            Kamida 6 belgi. Adminning barcha sessiyalari yopiladi — u qaytadan
            kirishi kerak bo&apos;ladi.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={reset.isPending}>
            Bekor qilish
          </Button>
          <Button
            disabled={password.length < 6 || reset.isPending}
            onClick={() =>
              reset.mutate({ id: user.id, password }, { onSuccess: onClose })
            }
          >
            {reset.isPending ? <Spinner /> : null}
            Almashtirish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
