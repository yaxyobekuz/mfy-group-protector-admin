import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

/**
 * ⚠️ SHRIFT `next/font` ORQALI, `<link>` bilan emas: Next uni
 * build paytida YUKLAB OLIB o'zi tarqatadi. CDN havolasi bo'lsa
 * panel Google'ga bog'liq bo'lib qolardi va ichki tarmoqda
 * (internetsiz shtab binosida) shrift umuman yuklanmasdi.
 *
 * ⚠️ `display: "swap"`: shrift yuklanguncha matn KO'RINIB turadi.
 * Standart `auto` bilan brauzer matnni bir necha yuz millisekund
 * yashirib turardi ("ko'rinmas matn").
 *
 * ⚠️ LOTIN KENGAYTMASI (`latin-ext`) SHART: o'zbek alifbosidagi
 * `oʻ` va `gʻ` belgilari asosiy `latin` to'plamida YO'Q va ular
 * boshqa shriftdan "qarzga" olinib, qatorda ajralib turardi.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Viloyat shtabi",
  description: "MFY guruhlaridagi muammolarni aniqlash tizimi",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    /**
     * ⚠️ `suppressHydrationWarning` MAJBURIY: `next-themes`
     * `<html>` ga `class="dark"` ni MIJOZDA qo'shadi va server
     * tomonida u yo'q — React buni "hydration mismatch" deb
     * konsolga ogohlantirish yozardi (har sahifa yuklanishida).
     */
    <html lang="uz" suppressHydrationWarning className={jakarta.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
