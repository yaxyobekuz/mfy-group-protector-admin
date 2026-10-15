"use client";

/**
 * KIRISH SAHIFASI.
 *
 * ⚠️ BU SAHIFA `(app)` GURUHIDAN TASHQARIDA: u `AppShell` ichida
 * emas, ya'ni sidebar va header ko'rinmaydi. Agar ichida bo'lsa,
 * shell `useSession` orqali tokenni tekshirib, login sahifasiga
 * cheksiz yo'naltirib qolardi.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/entities/session/auth-provider";
import { ApiError, tokens } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { FieldError, Input, Label } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/states";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * ⚠️ ALLAQACHON KIRGAN ODAM BOSHQARUV PANELIGA yo'naltiriladi:
   * aks holda u "Chiqish" bosmaguncha login formasini ko'rib turardi
   * (masalan, brauzer tarixidan qaytsa).
   */
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
    } catch (caught) {
      // ⚠️ SERVER MATNI KO'RSATILADI ("Login yoki parol xato").
      // Server ataylab login mavjudligini oshkor qilmaydi — panel
      // ham o'zidan qo'shmasligi kerak.
      setError(
        caught instanceof ApiError ? caught.message : "Kirish amalga oshmadi",
      );
    } finally {
      // ⚠️ `finally` DA: muvaffaqiyatli kirishda `router.replace`
      // bo'lsa ham, komponent bir lahza ko'rinib turadi va tugma
      // "yuklanmoqda" holatida qotib qolmasligi kerak.
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Viloyat shtabi</CardTitle>
          <CardDescription>
            MFY guruhlaridagi muammolarni aniqlash tizimi
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Login</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                // ⚠️ `autoFocus`: bu sahifaning yagona vazifasi —
                // formani to'ldirish.
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <FieldError message={error ?? undefined} />

            <Button
              type="submit"
              className="w-full"
              // ⚠️ BO'SH MAYDONLARDA O'CHIRILGAN: server baribir rad
              // etardi, lekin bu bir keraksiz so'rov va bir
              // keraksiz xato xabari.
              disabled={isSubmitting || !username.trim() || !password}
            >
              {isSubmitting ? <Spinner /> : null}
              Kirish
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
