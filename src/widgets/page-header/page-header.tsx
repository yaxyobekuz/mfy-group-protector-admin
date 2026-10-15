import type { ReactNode } from "react";

/**
 * SAHIFA SARLAVHASI.
 *
 * ⚠️ `description` TAVSIYA ETILADI: bu panel atamalari odatiy
 * emas ("signal", "rasmiy guruh") va bir qatorli izoh
 * foydalanuvchiga ularning MA'NOSINI aytadi. Yo'riqnoma o'qiydigan
 * odam yo'q.
 */
export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div className="space-y-1">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </div>
);
