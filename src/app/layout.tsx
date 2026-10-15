import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Providers } from "./providers";

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
    <html lang="uz" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
