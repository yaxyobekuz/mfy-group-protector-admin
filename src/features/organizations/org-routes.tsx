"use client";

/**
 * YO'NALTIRISH QOIDALARI — TUMAN × YO'NALISH → TASHKILOT.
 *
 * ── NIMA UCHUN KALIT TUMAN, MFY EMAS ──────────────────────────────────
 *
 * ⚠️ "Ijrochilar" sahifasi MFY × yo'nalish bo'yicha ishlaydi va u shtab
 * XODIMI uchun to'g'ri: bitta operator o'n MFY ni yuritadi. Tashkilot
 * esa TUMAN darajasida ishlaydi — "Asaka suv ta'minoti" o'sha tumanning
 * hamma mahallasiga xizmat qiladi. MFY bo'yicha qo'yilsa, 500 MFY × 22
 * yo'nalish = 11 000 katakchani QO'LDA to'ldirish kerak bo'lardi.
 *
 * ── VILOYAT ZAXIRASI ──────────────────────────────────────────────────
 *
 * ⚠️ TUMAN TANLANMAGANDA SHU RO'YXAT KO'RINADI: 22 ta qator butun
 * viloyatni DARHOL ishga tushiradi, keyin tumanlar birma-bir
 * aniqlashtiriladi. Mijozning "hammani ro'yxatdan o'tkazish shart emas"
 * talabi aynan shu.
 */

import { useState } from "react";
import { Network, X } from "lucide-react";

import { useOrgRoutes, useOrganizations, useRemoveOrgRoute, useSaveOrgRoute } from "@/features/organizations/api";
import { useDistricts } from "@/features/territory/api";
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

const PROVINCE = "__province__";
const NONE = "__none__";

export const OrgRoutes = ({ canManage }: { canManage: boolean }) => {
  /**
   * ⚠️ STANDART HOLDA VILOYAT ZAXIRASI KO'RINADI, tuman tanlash
   * TALAB QILINMAYDI. "Ijrochilar" sahifasida tuman majburiy, chunki
   * u MFY ro'yxatini ochadi (yuzlab yozuv); bu yerda esa ro'yxat
   * 22 ta yo'nalish va zaxira qoidasi eng KERAKLI ko'rinish — u
   * butun viloyatni bir ekranda hal qiladi.
   */
  const [districtId, setDistrictId] = useState<string>(PROVINCE);

  const districts = useDistricts();
  const routes = useOrgRoutes(
    districtId === PROVINCE ? {} : { districtId },
  );

  /**
   * ⚠️ ARXIVLANGANLAR SO'RALMAYDI: ularga qoida qo'yilmaydi (server
   * rad etadi) va ro'yxatda ko'rinib turib, tanlanganda xato berish
   * eng yomon tajriba bo'lardi.
   */
  const organizations = useOrganizations();

  const save = useSaveOrgRoute();
  const remove = useRemoveOrgRoute();

  /**
   * TANLASH RO'YXATI.
   *
   * ⚠️ TUMAN TANLANGANDA O'SHA TUMANNING VA VILOYAT TASHKILOTLARI
   * ko'rsatiladi: boshqa tumanning suv ta'minotiga yo'naltirish
   * murojaatni begona tashkilotga yuborardi. Viloyat tashkiloti esa
   * hamma tumanga xizmat qiladi va ro'yxatdan chiqarilsa, uni
   * tumanga biriktirish yo'li yo'qolardi.
   */
  const selectable = (organizations.data ?? []).filter((org) => {
    if (org.isArchived || !org.isActive) return false;
    if (districtId === PROVINCE) return true;
    return org.district === null || org.district.id === districtId;
  });

  const scopeLabel =
    districtId === PROVINCE
      ? "Butun viloyat (zaxira)"
      : (districts.data?.find((d) => d.id === districtId)?.name ?? "");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Label>Kesim</Label>
          <Select value={districtId} onValueChange={setDistrictId}>
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
      </div>

      <p className="mb-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        {districtId === PROVINCE ? (
          <>
            Bu qoidalar <strong>barcha tumanlar</strong> uchun ishlaydi — tumaniga
            alohida qoida qo&apos;yilmagan murojaat shu tashkilotga ketadi. Tumanga
            qo&apos;yilgan qoida esa zaxiradan <strong>ustun</strong>.
          </>
        ) : (
          <>
            <strong>{scopeLabel}</strong> uchun qoidalar. Bo&apos;sh qoldirilgan
            yo&apos;nalishda <strong>viloyat zaxirasi</strong> ishlatiladi — u
            ro&apos;yxatda kulrang ko&apos;rsatilgan.
          </>
        )}
      </p>

      {routes.isLoading ? (
        <CardSkeleton count={4} />
      ) : routes.isError ? (
        <ErrorState
          message={routes.error instanceof ApiError ? routes.error.message : undefined}
          onRetry={() => void routes.refetch()}
        />
      ) : (routes.data?.categories.length ?? 0) === 0 ? (
        <EmptyState
          icon={Network}
          title="Yo'nalish yo'q"
          hint="Avval Murojaatlar → Yo'nalishlar bo'limidan yo'nalish qo'shing."
        />
      ) : (
        <Card className="divide-y p-0">
          {routes.data?.categories.map((category) => {
            /**
             * ⚠️ IKKI QOIDA QIDIRILADI: tanlangan kesimdagisi va
             * VILOYAT zaxirasi. Zaxira ko'rsatilmasa, bo'sh
             * katakcha "hech qayerga ketmaydi" degan NOTO'G'RI
             * xulosa berardi — holbuki murojaat baribir
             * yo'naltiriladi.
             */
            const own = routes.data?.routes.find(
              (route) =>
                route.categoryId === category.id &&
                (districtId === PROVINCE
                  ? route.districtId === null
                  : route.districtId === districtId),
            );

            const fallback =
              districtId === PROVINCE
                ? undefined
                : routes.data?.routes.find(
                    (route) =>
                      route.categoryId === category.id && route.districtId === null,
                  );

            return (
              <div
                key={category.id}
                className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {/* ⚠️ OTA YO'NALISH HAM KO'RSATILADI: yakka
                        "Ichimlik suvi" kontekstsiz qoladi va
                        "Tozalik" bilan adashtirilishi mumkin
                        (AI promptidagi ayni sabab). */}
                    {category.parent ? (
                      <span className="text-muted-foreground">
                        {category.parent.name} →{" "}
                      </span>
                    ) : null}
                    {category.name}
                  </p>

                  {!own && fallback ? (
                    <p className="truncate text-xs text-muted-foreground">
                      Zaxira: {fallback.organization.shortName ?? fallback.organization.name}
                    </p>
                  ) : null}

                  {!own && !fallback ? (
                    <p className="truncate text-xs text-amber-700 dark:text-amber-400">
                      Tashkilot belgilanmagan
                      {category.orgName ? ` — ilovada "${category.orgName}" matni ko'rinadi` : ""}
                    </p>
                  ) : null}
                </div>

                {own?.isBroken ? (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200">
                    Tashkilot faol emas
                  </Badge>
                ) : null}

                <div className="flex w-full items-center gap-1 sm:w-80">
                  <Select
                    value={own?.organization.id ?? NONE}
                    disabled={!canManage || save.isPending}
                    onValueChange={(value) => {
                      if (value === NONE) {
                        if (own) remove.mutate(own.id);
                        return;
                      }
                      save.mutate({
                        organizationId: value,
                        categoryId: category.id,
                        districtId: districtId === PROVINCE ? undefined : districtId,
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="— Belgilanmagan —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Belgilanmagan —</SelectItem>
                      {selectable.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.shortName ?? org.name}
                          {org.district === null ? " (viloyat)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {own && canManage ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 px-2 text-muted-foreground"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(own.id)}
                      title="Qoidani olib tashlash"
                    >
                      <X className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
};
