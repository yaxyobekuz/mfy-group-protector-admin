import type { ReactNode } from "react";

/**
 * SAHIFA SARLAVHASI.
 *
 * ⚠️ `description` PROPI YO'Q va qaytarilmaydi: sarlavha ostidagi
 * izohlar ataylab olib tashlandi. Propni "ixtiyoriy" holda qoldirish
 * ularning birma-bir qaytib kelishiga yo'l qo'yardi — har safar
 * bitta sahifada, va panel yana ikki xil ko'rinishga ega bo'lardi.
 */
export const PageHeader = ({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) => (
  /**
   * ⚠️ SARLAVHA YIRIK (`text-3xl`): izoh olib tashlangandan keyin
   * sahifaning boshi faqat shu qator bilan belgilanadi va kichik
   * sarlavha karta sarlavhalaridan ajralmay qolardi.
   */
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
    {actions ? (
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    ) : null}
  </div>
);
