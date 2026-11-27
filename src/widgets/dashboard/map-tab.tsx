"use client";

/**
 * "XARITA" TABI — QAYERDA NIMA BO'LYAPTI.
 *
 * ⚠️ `/map` SAHIFASINING NUSXASI EMAS, IKKISI BOSHQA SAVOLGA
 * JAVOB BERADI:
 *
 *   tab    →  qaysi TUMANDA ko'p (14–17 poligon, jadval, kesim)
 *   /map   →  qayerda ANIQ nima bo'ldi (nuqtalar, issiqlik, MFY)
 *
 * Shuning uchun tabda `DistrictMapPanel` turadi (hudud kesimi,
 * filtr va tartiblangan jadval bilan), to'liq xaritaga esa
 * havola beriladi.
 *
 * ⚠️ TO'LIQ XARITA TABGA SIG'MAYDI: u `document.body` ga portal
 * bo'lib, BUTUN EKRANGA orqa fon sifatida chiziladi
 * (`map/page.tsx`). Tab ichiga tiqilsa, sidebar va panellar
 * uning ustida qolib, tab mazmuni ko'rinmasdi.
 *
 * ⚠️ PANEL O'ZINING TO'RINI OLIB KELADI (xarita + yon ustun),
 * shuning uchun bu tab 6 ustunli bento to'rini ISHLATMAYDI —
 * ikki qavatli to'r tor ekranda xaritani siqib, tumanlarni
 * o'qilmaydigan qilardi.
 *
 * ⚠️ TAB O'ZIDAN HECH NARSA QO'SHMAYDI: to'liq xaritaga havola
 * panelning sarlavhasida ALLAQACHON bor ("Nuqtalar xaritasi").
 * Tabga ikkinchisi qo'yilsa, bitta ekranda bir joyga olib
 * boradigan ikki tugma turardi.
 */

import { DistrictMapPanel } from "@/widgets/district-map/district-map-panel";

export const MapTab = () => <DistrictMapPanel />;
