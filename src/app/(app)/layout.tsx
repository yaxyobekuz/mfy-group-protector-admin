import type { ReactNode } from "react";

import { AppShell } from "@/widgets/app-shell/app-shell";

/**
 * ⚠️ `(app)` — YO'L GURUHI (URL'ga tushmaydi). Login sahifasi bu
 * guruhdan TASHQARIDA: u `AppShell` ichida bo'lsa, shell tokenni
 * tekshirib login sahifasiga cheksiz yo'naltirib qolardi.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
