"use client";

/**
 * AUDIT JURNALI — faqat O'QISH.
 *
 * ⚠️ FAQAT MUHIM AMALLAR yoziladi, har so'rov emas: login, ruxsat
 * o'zgarishi, guruhni kuzatuvga qo'yish, signalni biriktirish,
 * murojaat holati. "Hamma narsani yozish" jurnalni o'qib
 * bo'lmaydigan qilardi — va u o'shandan keyin hech kimga kerak
 * bo'lmasdi.
 *
 * ⚠️ `meta` KO'RSATILADI (eski/yangi qiymat): "AI nima uchun o'chib
 * qolgan" degan savolga javob faqat shundan topiladi. Lekin u
 * YIG'ILGAN holda — ochib ko'rish uchun bosiladi, aks holda jadval
 * JSON bilan to'lib ketardi.
 */

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, ScrollText } from "lucide-react";

import { useAudit, type AuditFilters } from "@/features/reports/api";
import { ApiError } from "@/shared/api/client";
import { AUDIT_ACTION } from "@/shared/config/labels";
import { formatDateTimeUz } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
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

const ALL = "__all__";

/**
 * BO'LIM FILTRI.
 *
 * ⚠️ `startsWith` BO'YICHA (server shunday qiladi): "signal." →
 * `signal.attach` va `signal.dismiss`. Har amalni alohida tanlash
 * ro'yxatni o'nlab qatorga aylantirardi.
 */
const SECTIONS = [
  { value: "auth.", label: "Kirish" },
  { value: "group.", label: "Guruhlar" },
  { value: "signal.", label: "Signallar" },
  { value: "issue.", label: "Murojaatlar" },
  { value: "issue_category.", label: "Yo'nalishlar" },
  { value: "territory.", label: "Hudud" },
  { value: "user.", label: "Xodimlar" },
  { value: "settings.", label: "Sozlamalar" },
];

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1, limit: 50 });
  const [expanded, setExpanded] = useState<string | null>(null);

  const audit = useAudit(filters);

  return (
    <>
      <PageHeader
        title="Audit jurnali"
      />

      <div className="mb-4 max-w-xs">
        <Select
          value={filters.action ?? ALL}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              action: value === ALL ? undefined : value,
              page: 1,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Bo'lim" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha bo&apos;limlar</SelectItem>
            {SECTIONS.map((section) => (
              <SelectItem key={section.value} value={section.value}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        {audit.isLoading ? (
          <TableSkeleton rows={10} cols={4} />
        ) : audit.isError ? (
          <ErrorState
            message={audit.error instanceof ApiError ? audit.error.message : undefined}
            onRetry={() => void audit.refetch()}
          />
        ) : (audit.data?.items.length ?? 0) === 0 ? (
          <EmptyState icon={ScrollText} title="Yozuv topilmadi" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Vaqt</TableHead>
                <TableHead>Xodim</TableHead>
                <TableHead>Amal</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {audit.data?.items.map((entry) => {
                const isOpen = expanded === entry.id;
                const hasMeta = entry.meta && Object.keys(entry.meta).length > 0;

                return (
                  // ⚠️ `Fragment` KALIT BILAN: bitta yozuv IKKI
                  // qator berishi mumkin (asosiy + yoyilgan meta)
                  // va qisqa `<>` sintaksisi `key` ni qabul
                  // qilmaydi.
                  <Fragment key={entry.id}>
                    <TableRow>
                      <TableCell>
                        {hasMeta ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() => setExpanded(isOpen ? null : entry.id)}
                            aria-label="Batafsil"
                          >
                            {isOpen ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </Button>
                        ) : null}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTimeUz(entry.createdAt)}
                      </TableCell>

                      <TableCell className="text-sm">
                        {entry.user ? (
                          <div>
                            <p>
                              {entry.user.firstName} {entry.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <code>{entry.user.username}</code>
                            </p>
                          </div>
                        ) : entry.userId ? (
                          // ⚠️ XODIM O'CHIRILGAN BO'LSA ham yozuv
                          // QOLADI: audit append-only. Shuning uchun
                          // `userId` ko'rsatiladi.
                          <span className="text-xs text-muted-foreground">
                            O&apos;chirilgan xodim
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm">
                        {/* ⚠️ TANILMAGAN AMAL KALIT ko'rinishida
                            chiqadi — `undefined` dan yaxshi va
                            yangi amal qo'shilganda jurnal darhol
                            ishlaydi. */}
                        {AUDIT_ACTION[entry.action] ?? <code>{entry.action}</code>}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {entry.ip ?? "—"}
                      </TableCell>
                    </TableRow>

                    {isOpen && hasMeta ? (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30">
                          <pre className="overflow-x-auto text-xs leading-relaxed">
                            {JSON.stringify(entry.meta, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {audit.data && audit.data.total > audit.data.limit ? (
        <div className="flex items-center justify-between pt-3">
          <p className="text-xs text-muted-foreground">
            {audit.data.total} ta yozuv · {audit.data.page}-sahifa
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={audit.data.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            >
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!audit.data.hasMore}
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
