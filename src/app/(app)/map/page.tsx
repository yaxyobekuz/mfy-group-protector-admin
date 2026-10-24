"use client";

/**
 * MUROJAATLAR XARITASI.
 *
 * ⚠️ BU "MUROJAATLAR" RO'YXATINING BOSHQA KO'RINISHI, alohida
 * bo'lim emas: ayni ma'lumot, ayni qamrov (`issues.view` ruxsati,
 * `mahallaScopeWhere` filtri). Shuning uchun u menyuda
 * murojaatlardan KEYIN turadi.
 *
 * ⚠️ FAQAT KOORDINATASI BOR MUROJAATLAR: ular mobil ilovadan
 * keladi. Signaldan yoki panelda qo'lda yaratilganlarda joy yo'q va
 * bu ekranda ularning yo'qligi AYTILADI — aks holda "xaritada
 * hammasi yo'q" degan savol tug'ilardi.
 */

import { MapPin, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useActiveCategories, useIssueMap } from "@/features/issues/api";
import type { IssueStatus } from "@/shared/api/types";
import { ISSUE_PRIORITY, ISSUE_STATUS } from "@/shared/config/labels";
import { formatDateTimeUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { EmptyState, ErrorState, Spinner } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";
import { MapView, type MapMarker } from "@/widgets/issue-map/map-view";

const ALL = "__all__";

/** ⚠️ RANG YO'NALISHDAN, HOLATDAN EMAS — pastdagi izohga qara. */
const FALLBACK_COLOR = "#2563eb";

export default function IssueMapPage() {
  const [status, setStatus] = useState<string>(ALL);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [selected, setSelected] = useState<string | null>(null);

  const categories = useActiveCategories();

  const { data, isLoading, isError, error, refetch } = useIssueMap({
    status: status === ALL ? undefined : (status as IssueStatus),
    categoryId: categoryId === ALL ? undefined : categoryId,
  });

  const markers = useMemo<MapMarker[]>(
    () =>
      (data ?? [])
        // ⚠️ KOORDINATASIZ NUQTA TASHLANADI: server ularni
        // filtrlaydi, lekin tur bo'yicha `null` bo'lishi mumkin va
        // `L.marker(null)` butun qatlamni yiqitardi.
        .filter((point) => point.lat !== null && point.lng !== null)
        .map((point) => ({
          id: point.id,
          lat: point.lat!,
          lng: point.lng!,
          /**
           * ⚠️ RANG YO'NALISHDAN KELADI, HOLATDAN EMAS. Xaritada
           * asosiy savol — "qayerda NIMA bo'lyapti": bir ko'chada
           * beshta chiqindi nuqtasi yoki beshta yo'l nuqtasi
           * butunlay boshqa xulosaga olib keladi. Holat esa
           * nuqta ochilganda ko'rinadi.
           */
          color: point.category.color ?? FALLBACK_COLOR,
          onClick: () => setSelected(point.id),
        })),
    [data],
  );

  const active = (data ?? []).find((point) => point.id === selected);

  return (
    <div>
      <PageHeader
        title="Murojaatlar xaritasi"
        actions={
          <span className="text-sm text-muted-foreground">
            {isLoading ? <Spinner className="size-4" /> : `${markers.length} ta nuqta`}
          </span>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[13rem]">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barcha holatlar</SelectItem>
              {(Object.keys(ISSUE_STATUS) as IssueStatus[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {ISSUE_STATUS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-[15rem]">
              <SelectValue placeholder="Yo'nalish" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barcha yo&apos;nalishlar</SelectItem>
              {(categories.data ?? []).map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="ml-auto text-xs text-muted-foreground">
            {/* ⚠️ "NEGA HAMMASI YO'Q" SAVOLIGA JAVOB — fayl
                boshidagi izoh. */}
            Xaritada faqat joyi ko&apos;rsatilgan murojaatlar ko&apos;rinadi
            (mobil ilovadan kelganlar).
          </p>
        </CardContent>
      </Card>

      {isError ? (
        <ErrorState message={error?.message} onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Card className="overflow-hidden">
            {/* ⚠️ BALANDLIK ANIQ (`h-[70vh]`): Leaflet ota
                elementning balandligini o'lchaydi va u `auto`
                bo'lsa xarita 0 piksel balandlikda, kulrang
                maydon bo'lib ochilardi. */}
            <div className="h-[70vh] min-h-[24rem]">
              <MapView markers={markers} className="h-full w-full" />
            </div>
          </Card>

          <div>
            {active ? (
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {active.publicNo}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="-mr-2 -mt-1 size-7 p-0"
                      onClick={() => setSelected(null)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  <h3 className="font-semibold leading-snug">{active.title}</h3>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={ISSUE_STATUS[active.status].className}>
                      {ISSUE_STATUS[active.status].label}
                    </Badge>
                    <Badge className={ISSUE_PRIORITY[active.priority].className}>
                      {ISSUE_PRIORITY[active.priority].label}
                    </Badge>
                    {active.isHazard ? (
                      <Badge className="bg-destructive/10 text-destructive">
                        <TriangleAlert className="mr-1 size-3" />
                        Fuqaro xavfli dedi
                      </Badge>
                    ) : null}
                  </div>

                  <dl className="space-y-1.5 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Yo&apos;nalish</dt>
                      <dd>{active.category.name}</dd>
                    </div>
                    {active.address ? (
                      <div>
                        <dt className="text-xs text-muted-foreground">Manzil</dt>
                        <dd>{active.address}</dd>
                      </div>
                    ) : null}
                    {active.mahalla ? (
                      <div>
                        <dt className="text-xs text-muted-foreground">MFY</dt>
                        <dd>{active.mahalla.name}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-xs text-muted-foreground">Yuborilgan</dt>
                      <dd>{formatDateTimeUz(active.createdAt)}</dd>
                    </div>
                  </dl>

                  <Button asChild className="w-full">
                    <Link href={`/issues/${active.id}`}>Murojaatni ochish</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <EmptyState
                  icon={MapPin}
                  title="Nuqtani tanlang"
                  hint="Xaritadagi belgini bosing — murojaat ma'lumoti shu yerda ochiladi."
                />
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
