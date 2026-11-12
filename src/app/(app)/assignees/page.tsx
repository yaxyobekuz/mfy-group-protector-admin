"use client";

/**
 * IJROCHILAR — MFY × yo'nalish → xodim.
 *
 * ── NIMA UCHUN BU SAHIFA BOR ──────────────────────────────────────────
 *
 * Murojaat kelganda u navbatga tushadi va kimdir uni ochib, ijrochi
 * tanlashi kerak. Amalda bu qadam KECHIKADI: MFY ko'p, yo'nalish ko'p
 * va "bu kimning ishi" degan savolga javob har safar qo'lda izlanadi.
 * SLA esa murojaat YARATILGAN paytdan hisoblanadi — ya'ni kechikkan
 * taqsimot muddatni yeb qo'yadi.
 *
 * Javob aslida OLDINDAN MA'LUM: "Chilonzor 12-MFY dagi suv muammosi —
 * Aliyev". Shu sahifa o'sha javobni yozib qo'yadi va murojaat
 * yaratilishi bilan ijrochi O'ZI qo'yiladi.
 *
 * ── RO'YXAT MFY DAN BOSHLANADI ────────────────────────────────────────
 *
 * ⚠️ JADVAL "MFY × YO'NALISH" KO'RINISHIDA, mavjud qoidalar ro'yxati
 * sifatida EMAS. Sabab: asosiy savol "qaysi yo'nalish KIMSIZ qolgan" —
 * bo'sh katakchalar aynan shu. Faqat qoidalarni ko'rsatsak, ular
 * ko'rinmay qolardi.
 *
 * ── QOIDA KELAJAK UCHUN ───────────────────────────────────────────────
 *
 * ⚠️ O'ZGARTIRILGANDA ALLAQACHON YARATILGAN MUROJAATLAR TEGILMAYDI
 * (`Issue.assigneeId` — nusxa, jonli havola emas). Aks holda "o'tgan
 * oy kim ishlagan" degan savolga javob yo'qolardi.
 */

import { useState } from "react";
import { UserCog, X } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import {
  useAssignmentRules,
  useRemoveAssignmentRule,
  useSaveAssignmentRule,
} from "@/features/assignees/api";
import { useActiveCategories } from "@/features/issues/api";
import { useDistricts } from "@/features/territory/api";
import { useUsers } from "@/features/users/api";
import { ApiError } from "@/shared/api/client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Label } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CardSkeleton, EmptyState, ErrorState } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";

/** Bo'sh katakcha qiymati — Radix `Select` bo'sh satrni qabul qilmaydi. */
const NONE = "__none__";

export default function AssigneesPage() {
  const { can } = useSession();

  const [districtId, setDistrictId] = useState<string | null>(null);

  const districts = useDistricts();
  const categories = useActiveCategories();

  /**
   * ⚠️ XODIMLAR RO'YXATI KENG OLINADI (200): u tanlash uchun va
   * sahifalash bu yerda ma'nosiz bo'lardi — operator ismni ro'yxatdan
   * topadi, "keyingi sahifa" tugmasini bosmaydi.
   */
  const users = useUsers({ page: 1, limit: 200 });

  /**
   * ⚠️ TUMAN TANLANMAGUNCHA SO'RALMAYDI: viloyatdagi barcha MFY ni
   * bir so'rovda olish (yuzlab yozuv × yo'nalishlar) sahifani
   * sekinlashtirardi.
   */
  const rules = useAssignmentRules(
    { districtId: districtId ?? undefined },
    Boolean(districtId),
  );

  const save = useSaveAssignmentRule();
  const remove = useRemoveAssignmentRule();

  if (!can("issues.assign")) {
    return (
      <EmptyState
        icon={UserCog}
        title="Sizda bu bo'limga ruxsat yo'q"
        hint="Ijrochi belgilash huquqi kerak (Muammolar → Ijrochi belgilash)."
      />
    );
  }

  const activeUsers = (users.data?.items ?? []).filter(
    (user) => user.isActive && !user.isArchived,
  );

  return (
    <>
      <PageHeader
        title="Ijrochilar"
        actions={
          <div className="w-64">
            <Select
              value={districtId ?? NONE}
              onValueChange={(value) => setDistrictId(value === NONE ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tumanni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Tumanni tanlang</SelectItem>
                {districts.data?.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <p className="mb-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        Shu yerda belgilangan xodim o&apos;sha MFY dan kelgan, o&apos;sha
        yo&apos;nalishdagi murojaatlarga <strong>avtomatik</strong> biriktiriladi —
        bot, ilova va signal orqali kelganlariga ham. Allaqachon yaratilgan
        murojaatlar o&apos;zgarmaydi.
      </p>

      {!districtId ? (
        <EmptyState
          icon={UserCog}
          title="Tumanni tanlang"
          hint="MFY lar ro'yxati tuman bo'yicha ochiladi."
        />
      ) : rules.isLoading ? (
        <CardSkeleton count={5} />
      ) : rules.isError ? (
        <ErrorState
          message={rules.error instanceof ApiError ? rules.error.message : undefined}
          onRetry={() => void rules.refetch()}
        />
      ) : (rules.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Bu tumanda MFY yo'q"
          hint="Avval Hudud bo'limidan MFY qo'shing."
        />
      ) : (
        <div className="space-y-3">
          {rules.data?.map((mahalla) => (
            <Card key={mahalla.id} className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="font-medium">{mahalla.name}</p>
                <Badge className="bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {mahalla.rules.length} / {categories.data?.length ?? 0} yo&apos;nalish
                </Badge>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {categories.data?.map((category) => {
                  const rule = mahalla.rules.find(
                    (item) => item.categoryId === category.id,
                  );

                  return (
                    <div
                      key={category.id}
                      className="space-y-1.5 rounded-lg border p-2.5"
                    >
                      <Label className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate">{category.name}</span>
                        {/*
                          ⚠️ "QOIDA BOR, LEKIN ISHLAMAYDI" KO'RSATILADI:
                          xodim arxivlangan bo'lsa, server uni
                          o'tkazmaydi va murojaat ijrochisiz qoladi.
                          Yashirilsa, ma'muriyat "belgilangan" deb
                          o'ylab yuraverardi.
                        */}
                        {rule?.isBroken ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200">
                            Xodim faol emas
                          </Badge>
                        ) : null}
                      </Label>

                      <div className="flex items-center gap-1">
                        <Select
                          value={rule?.user.id ?? NONE}
                          disabled={save.isPending}
                          onValueChange={(value) => {
                            if (value === NONE) {
                              if (rule) remove.mutate(rule.id);
                              return;
                            }
                            save.mutate({
                              mahallaId: mahalla.id,
                              categoryId: category.id,
                              userId: value,
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="— Belgilanmagan —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>— Belgilanmagan —</SelectItem>
                            {activeUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {rule ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 px-2 text-muted-foreground"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(rule.id)}
                            title="Qoidani olib tashlash"
                          >
                            <X className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
