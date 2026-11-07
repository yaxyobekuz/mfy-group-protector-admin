import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * `Next-Action` HEADER'LI SO'ROVLAR KESILADI.
 *
 * ⚠️ NIMA UCHUN: panelda Server Action UMUMAN ISHLATILMAYDI — birorta
 * ham `"use server"` fayli yo'q, ma'lumot `shared/api` orqali
 * serverga HTTP bilan boradi. Ya'ni bu header bilan kelgan so'rov
 * QONUNIY BO'LISHI MUMKIN EMAS: uni faqat tashqi skaner yuboradi.
 *
 * ⚠️ ZARAR YO'Q EDI, SHOVQIN BOR EDI: Next qo'lbola id'ni o'zi rad
 * etadi (400) — lekin har so'rovda stderr'ga to'liq stack trace
 * yozadi ("The Server Reference ID did not match the expected
 * format"). Log shu bilan to'lib, HAQIQIY xato ko'rinmay qolardi —
 * aynan shu sababdan kesiladi, "hujumni to'xtatish" uchun emas.
 *
 * ⚠️ `404`, `403` EMAS: mavjud bo'lmagan imkoniyatga murojaat —
 * "topilmadi". `403` skanerga "bu yerda nimadir bor, lekin ruxsat
 * yo'q" degan ma'lumot berardi.
 *
 * ⚠️ AGAR KELAJAKDA SERVER ACTION QO'SHILSA — BU FAYL O'CHIRILADI,
 * aks holda action JIMGINA 404 qaytarardi va sababini topish juda
 * qiyin bo'lardi.
 */
export function middleware(request: NextRequest) {
  if (request.headers.has("next-action")) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

/**
 * ⚠️ STATIK FAYLLAR CHETLAB O'TILADI: ular uchun middleware ishga
 * tushishi har rasm va skript so'rovini sekinlashtirardi, foydasi
 * esa yo'q — Server Action faqat sahifa so'rovlariga keladi.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
