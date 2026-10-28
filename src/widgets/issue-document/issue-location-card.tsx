"use client";

/**
 * MUROJAAT JOYLASHUVI — bitta kartada xarita + manzil + havola.
 *
 * ⚠️ AVVAL FAQAT KOORDINATA YOZILGANDI ("41.31082, 69.30176") va u
 * HECH NARSA AYTMASDI: operator raqamga qarab joyni tasavvur qila
 * olmaydi. Endi xaritaning O'ZI ko'rinadi — "qayerda" degan savolga
 * javob sahifaning ichida, ochmasdan beriladi.
 *
 * ⚠️ XARITA KICHIK VA ZUMSIZ EMAS: bu TASDIQLASH ko'rinishi
 * ("ha, o'sha ko'cha"), tahlil quroli emas. Kengroq ko'rish kerak
 * bo'lsa — Google Maps havolasi, chunki u yerda ko'cha ko'rinishi,
 * yo'nalish va qidiruv bor va ularni bu yerda qayta yozish
 * ma'nosiz.
 *
 * ⚠️ KOORDINATA HAVOLA SIFATIDA QOLADI: avvalgi ko'rinishda u
 * bosiladigan edi va odam shunga o'rganib qolgan bo'lishi mumkin.
 *
 * ⚠️ MAHALLA/TUMAN — KOORDINATADAN ALOHIDA QATOR: koordinata
 * fuqaro ilovada QADAGAN nuqta, mahalla esa murojaatning RASMIY
 * hududi (`Issue.mahallaId` — muhrlangan). Ikkisi mos kelmasligi
 * MUMKIN (fuqaro ishxonasidan turib uyi haqida yozgan) va bu
 * farqni ko'rsatish kerak, yashirish emas.
 */

import { ExternalLink, MapPin } from "lucide-react";

import { MapView } from "@/widgets/issue-map/map-view";
import { categoryColor } from "@/shared/config/category-icons";
import type { IssueDetail } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export const IssueLocationCard = ({ data }: { data: IssueDetail }) => {
  /*
   * ⚠️ `null` TEKSHIRUVI SHU YERDA, CHAQIRUVCHIDA EMAS: joy —
   * IXTIYORIY maydon (botdan va signaldan kelgan murojaatda umuman
   * yo'q). Tekshiruv chaqiruvchida bo'lsa, har yangi joyda qayta
   * yozilardi va bittasida unutilganda xarita `NaN` koordinata
   * bilan ochilib, bo'sh kulrang maydon chiqarardi.
   */
  if (data.lat === null || data.lng === null) return null;

  const lat = data.lat;
  const lng = data.lng;

  /*
   * ⚠️ `q=` PARAMETRI, `ll=` EMAS: `q` nuqtani BELGILAB ko'rsatadi,
   * `ll` esa shunchaki xaritani o'sha joyga suradi — belgisiz.
   * Operator havolani ochib, qaysi nuqta haqida gap ketayotganini
   * topa olmasdi.
   */
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <Card>
      {/* ⚠️ `flex-row`: `CardHeader` standart holda `flex-col` —
          sarlavha va tugma ustma-ust tushib, karta cho'zilardi. */}
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm">Joylashuv</CardTitle>

        <Button variant="outline" size="sm" asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            Google Maps
          </a>
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {/*
          ⚠️ XARITA KARTA KENGLIGIDA, ICHKI CHEKKASIZ: ramka ichida
          ramka hosil bo'lmasligi uchun `overflow-hidden` + yumaloq
          burchak. Balandlik QAT'IY (`h-56`): Leaflet konteyner
          balandligini o'zi aniqlay olmaydi va `auto` bo'lsa xarita
          0 piksel bo'lib, kulrang qolardi.
        */}
        {/*
          ⚠️ TUNDA PLITKALAR SO'NDIRILADI (`dark:brightness-...`):
          OpenStreetMap plitkalari OQ va to'q panelda kichik karta
          yorug' dog' bo'lib, ko'zni qamashtirardi (butun ekranli
          `/map` sahifasida bu sezilmaydi — u yerda xarita
          ekranning O'ZI). Rang teskari aylantirilmaydi: xarita
          "negativ" ko'rinib, ko'cha nomlari o'qilmay qolardi.
        */}
        {/* ⚠️ `map-dim` — TUNDA PLITKALARNI SO'NDIRISH uchun
            (qoida `globals.css` da, Tailwind klassi bilan emas:
            Leaflet plitkaga o'z `filter` ini qo'yadi va utilit
            klass undan ustun chiqa olmaydi). */}
        <div className="map-dim h-56 overflow-hidden rounded-xl border border-border">
          <MapView
            center={[lat, lng]}
            zoom={16}
            markers={[
              {
                id: data.id,
                lat,
                lng,
                color: categoryColor(data.category.color),
              },
            ]}
            className="h-full w-full"
          />
        </div>

        <div className="space-y-2 text-sm">
          {/* ⚠️ FUQARO YOZGAN MANZIL — KOORDINATADAN USTUN: odam
              uchun "Sarnavul MFY, 12-uy" raqamdan ko'ra aniqroq. */}
          {data.address ? (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{data.address}</span>
            </div>
          ) : null}

          {/*
            ⚠️ "HUDUD" BU YERDA TAKRORLANMAYDI: u yon ustundagi
            "Ma'lumot" kartasida allaqachon bor va u yerda HAR
            murojaat uchun ko'rinadi (koordinatasiz ham). Ikki
            joyda turganda, ekranda bir xil qator ikki marta
            ko'rinib, karta ma'nosiz takrorga aylanardi.

            ⚠️ Bu karta faqat KOORDINATA haqida: xarita, fuqaro
            yozgan manzil va nuqtaning o'zi.
          */}
          <div className="flex items-start justify-between gap-3">
            <span className="shrink-0 text-muted-foreground">Koordinata</span>
            <a
              className="text-right font-medium text-primary hover:underline"
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
