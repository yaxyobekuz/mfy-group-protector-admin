"use client";

/**
 * FUQARO SAHIFASI — profil, sanoqlar, blok holati.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Award, FileText, ShieldBan } from "lucide-react";

import { useSession } from "@/entities/session/auth-provider";
import { useBlockCitizen, useCitizen } from "@/features/citizens/api";
import { BlockDialog } from "@/features/citizens/block-dialog";
import { ApiError, fileUrl } from "@/shared/api/client";
import { formatDateUz } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { CardSkeleton, ErrorState } from "@/shared/ui/states";
import { PageHeader } from "@/widgets/page-header/page-header";
import { StatTile } from "@/widgets/stat-tile/stat-tile";

export default function CitizenPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useSession();
  const citizen = useCitizen(params.id);
  const block = useBlockCitizen();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (citizen.isLoading) return <CardSkeleton count={3} />;
  if (citizen.isError || !citizen.data) {
    return (
      <ErrorState
        message={citizen.error instanceof ApiError ? citizen.error.message : undefined}
        onRetry={() => void citizen.refetch()}
      />
    );
  }

  const data = citizen.data;
  const photo = fileUrl(data.photoUrl);
  const canManage = can("citizens.manage");

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="size-4" />
        Orqaga
      </Button>

      <PageHeader title={data.name} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="flex items-center gap-4 p-4">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="size-16 rounded-full object-cover" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-accent text-xl font-bold">
                {data.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-lg font-semibold">{data.name}</p>
              <p className="text-sm text-muted-foreground">
                {data.username ? `@${data.username}` : null}
                {data.username && data.phone ? " · " : null}
                {data.phone ?? null}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDateUz(data.createdAt)} dan beri
              </p>
            </div>
            {data.isBlocked ? (
              <Badge className="ml-auto bg-destructive/10 text-destructive">Bloklangan</Badge>
            ) : null}
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Murojaat" value={data.stats.total} icon={FileText} />
            <StatTile label="Hal qilindi" value={data.stats.resolved} tone="success" />
            <StatTile label="Ball" value={data.points} icon={Award} />
          </div>

          {data.isBlocked && data.blockReason ? (
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Blok sababi</p>
              <p className="mt-1 text-sm">{data.blockReason}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <h3 className="text-sm font-semibold">Ma&apos;lumot</h3>
            <Row label="Tuman" value={data.districtName ?? "—"} />
            <Row label="MFY" value={data.mahallaName ?? "—"} />
            <Row label="Telegram ID" value={data.telegramId} mono />

            {canManage ? (
              <Button
                variant={data.isBlocked ? "outline" : "destructive"}
                className="w-full"
                onClick={() => setDialogOpen(true)}
              >
                <ShieldBan className="mr-1.5 size-4" />
                {data.isBlocked ? "Blokni yechish" : "Bloklash"}
              </Button>
            ) : null}
          </Card>
        </div>
      </div>

      {dialogOpen ? (
        <BlockDialog
          name={data.name}
          currentlyBlocked={data.isBlocked}
          pending={block.isPending}
          onClose={() => setDialogOpen(false)}
          onConfirm={(reason) =>
            block.mutate(
              { id: data.id, blocked: !data.isBlocked, reason },
              { onSuccess: () => setDialogOpen(false) },
            )
          }
        />
      ) : null}
    </>
  );
}

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={mono ? "font-mono text-xs" : "font-medium"}>{value}</span>
  </div>
);
