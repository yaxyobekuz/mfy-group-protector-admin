"use client";

/**
 * GLOBAL PROVIDER'LAR.
 *
 * ⚠️ `QueryClient` `useState` ICHIDA YARATILADI, modul darajasida
 * EMAS. Modulda yaratilsa, Next'ning server tomonida u BARCHA
 * so'rovlar uchun UMUMIY bo'lib qolardi — ya'ni bir foydalanuvchining
 * keshi boshqasiga ko'rinardi. `useState` har mijoz uchun alohida
 * nusxa beradi.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { ApiError } from "@/shared/api/client";
import { AuthProvider } from "@/entities/session/auth-provider";

export const Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /**
             * ⚠️ 30 SEKUND: signallar va murojaatlar tez-tez
             * o'zgaradi (bot xabar yozyapti, AI signal chiqaryapti)
             * va uzoq kesh "biriktirdim, lekin ro'yxatda hali ham
             * yangi" degan holatni berardi. Juda qisqa bo'lsa esa
             * har tab almashishda so'rov ketardi.
             */
            staleTime: 30_000,

            /**
             * ⚠️ 401 VA 403 DA QAYTA URINILMAYDI: bu "ruxsat yo'q"
             * degan ANIQ javob va uni uch marta takrorlash faqat
             * xato ekranini sekinlashtiradi. Tarmoq xatosida esa
             * qayta urinish o'rinli.
             */
            retry: (failureCount, error) => {
              if (error instanceof ApiError) {
                if (error.status === 401 || error.status === 403) return false;
                // 4xx — so'rov xato, takrorlash yordam bermaydi.
                if (error.status >= 400 && error.status < 500) return false;
              }
              return failureCount < 2;
            },

            /**
             * ⚠️ `refetchOnWindowFocus` YOQILGAN: operator panelni
             * ochiq qoldirib ketadi va qaytganda YANGI signallarni
             * ko'rishi kerak. Bu aynan shu panelning ish uslubi.
             */
            refetchOnWindowFocus: true,
          },
          mutations: {
            // ⚠️ MUTATSIYA QAYTA URINILMAYDI: "signalni biriktir"
            // ikki marta ketsa, ikkita muammo yaratilishi mumkin
            // edi (serverdagi compare-and-swap buni to'xtatadi,
            // lekin unga tayanmaslik kerak).
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          {children}
          {/*
            ⚠️ `richColors`: muvaffaqiyat va xato xabarlari RANG
            bilan ajratiladi. Bir xil ko'rinishda bo'lsa,
            foydalanuvchi "yuborildi" va "yuborilmadi" ni
            farqlamasdi.
          */}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
