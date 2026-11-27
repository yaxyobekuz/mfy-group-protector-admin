"use client";

/**
 * XARITA — LEAFLET + OpenStreetMap (panel, faqat ko'rish).
 *
 * ⚠️ `react-leaflet` ISHLATILMADI (mobil bilan ayni sabab): u React
 * versiyasiga qattiq bog'langan. Leaflet'ning o'zi imperativ va uni
 * `useEffect` ichida boshqarish yetarli.
 *
 * ⚠️ FAQAT MIJOZ TOMONIDA: Leaflet `window` ga murojaat qiladi va
 * server renderida yiqilardi — shuning uchun `map-view.tsx`
 * `dynamic(..., { ssr: false })` bilan yuklaydi.
 *
 * ── UCH QATLAM ───────────────────────────────────────────────────────
 *
 *   markers  — har murojaat alohida nuqta ("qayerda nima bo'ldi")
 *   heat     — zichlik dog'i ("qayerda KO'P")
 *   areas    — MFY poligoni/doirasi ("qaysi MFY da ko'p")
 *
 * ⚠️ UCHALASI BIR VAQTDA YOQILISHI MUMKIN, lekin standart holda
 * faqat nuqtalar: hammasi birga yoqilsa, xarita o'qilmaydigan
 * bo'lib qolardi.
 */

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef } from "react";

import { HeatLayer, type HeatPoint } from "./heat-layer";
import {
  TERRITORY_ACTIVE,
  TERRITORY_ACTIVE_HOVER,
  TERRITORY_BASE,
  TERRITORY_BORDER,
  TERRITORY_BORDER_ACTIVE,
  TERRITORY_HOVER,
} from "./territory-colors";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  /** Bosilganda — o'ng panelni ochish uchun. */
  onClick?: () => void;
  /** `onClick` bo'lmasa — oddiy popup (ixtiyoriy). */
  popupHtml?: string;
  /** Tanlangan marker — kattaroq/belgili ko'rinadi. */
  active?: boolean;
}

/**
 * MFY KESIMI — POLIGON YOKI DOIRA.
 *
 * ⚠️ `geoJson` IXTIYORIY: MFY chegaralari rasmiy manbadan keladi va
 * hamma MFY uchun birdan topilmaydi. Chegara bo'lmasa, `lat`/`lng`
 * bo'yicha DOIRA chiziladi — ya'ni "qaysi MFY da ko'p" savoli
 * chegara kutilmasdan ham javob oladi.
 */
export interface MapArea {
  id: string;
  name: string;
  districtName: string;
  count: number;
  lat: number | null;
  lng: number | null;
  geoJson: unknown;
  /** ⚠️ Markaz taxminiy — chegara hali import qilinmagan. */
  isApproximate?: boolean;
  onClick?: () => void;

  /**
   * RANGNI TASHQARIDAN BERISH — IXTIYORIY.
   *
   * ⚠️ ODATDA BERILMAYDI: hudud rangi HOLATDAN kelib chiqadi —
   * tanlangan yoki tanlanmagan (`territory-colors.ts`). Maydon
   * esa qoldirildi, chunki `areas` qatlami hudud uchungina emas:
   * boshqa kesim qo'shilsa, unga o'z rangini berish yo'li ochiq
   * bo'lishi kerak.
   */
  color?: string;

  /**
   * ── TUMAN → MFY DRILL-DOWN ──────────────────────────────────
   *
   * ⚠️ IKKI DARAJA BITTA MASSIVDA KELADI va bu ataylab: Leaflet
   * poligonlarni QO'SHILISH TARTIBIDA chizadi, ya'ni avval
   * tumanlar, keyin MFY lar berilsa, MFY lar ustida turadi.
   * Ikki alohida qatlam qilinsa, ularning tartibini qo'lda
   * boshqarish kerak bo'lardi (`bringToFront`) va bitta
   * yangilanishda u albatta unutilardi.
   */

  /**
   * TANLANGAN TUMAN — KUCHLI CHEGARA, TO'LDIRISHSIZ.
   *
   * ⚠️ ICHI BO'YALMAYDI: uning ichini MFY poligonlari to'ldiradi
   * va tuman ham bo'yalsa, ikki rang ustma-ust tushib, MFY
   * kesimi o'qilmay qolardi.
   */
  selected?: boolean;

  /**
   * FAQAT CHEGARA — SONSIZ, TO'LDIRISHSIZ.
   *
   * ⚠️ NUQTALAR VA ISSIQLIK REJIMIDA TUMAN CHEGARASI SHU HOLDA
   * CHIZILADI: mijoz "viloyat turganda tumanlar kesimida chegara
   * ko'rinsin" deb so'ragan va u faqat "Hudud" rejimida
   * ko'rinardi — qolgan ikki rejimda nuqtalar tayanchsiz, bo'sh
   * fonda suzib turardi.
   *
   * ⚠️ TO'LDIRILMAYDI: ichki rang issiqlik dog'ini va markerlarni
   * bosib, o'sha rejimlarning butun ma'nosini ko'mib yuborardi
   * (viloyat romidagi ayni sabab).
   *
   * ⚠️ LEKIN BOSILADI — rom'dan farqi SHUNDA: tuman tanlanganda
   * nuqtalar o'sha tumanga FILTRLANADI, ya'ni chegara bu yerda
   * ham ishlaydigan element.
   */
  outline?: boolean;

  /**
   * TANLOVDAN TASHQARIDA — XIRA, LEKIN BOSILADI.
   *
   * ⚠️ BUTUNLAY OLIB TASHLANMAYDI: qolgan tumanlar yo'qolsa,
   * tanlangan tuman bo'sh fonda osilib qolardi va "viloyatning
   * qayerida" degan savol javobsiz qolardi. Bosilishi ham
   * saqlanadi — qo'shni tumanga o'tish uchun orqaga qaytish
   * shart emas.
   */
  dimmed?: boolean;
}

interface Props {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  heat?: HeatPoint[];
  areas?: MapArea[];
  /**
   * VILOYAT CHEGARASI — XARITANING TAYANCHI.
   *
   * ⚠️ QATLAM EMAS, ROM: unda SON yo'q va u boshqa qatlamlar
   * bilan navbatlashmaydi — har rejimda chiziladi. Chegarasiz
   * xaritada nuqtalar qo'shni viloyatlar va Qirg'iziston ustida
   * suzib turardi va "bu nuqta bizning hududdami" degan savolga
   * ko'z bilan javob berib bo'lmasdi.
   *
   * ⚠️ TO'LDIRILMAYDI: ichki rang poligon qatlamini (MFY/tuman)
   * bo'yab, "qayerda ko'p" savolini ko'mib yuborardi.
   */
  province?: unknown;
  /**
   * ⚠️ TO'Q MAVZU — PANEL MAVZUSIGA ERGASHADI: oq xarita qorong'i
   * panelda ko'zni qamashtiradi va operator kun bo'yi unga qaraydi.
   */
  dark?: boolean;
  className?: string;
}

/**
 * PLITKA MANBALARI.
 *
 * ⚠️ TO'Q VARIANT — CARTO \"Dark Matter\": u OpenStreetMap
 * ma'lumotidan yasalgan, bepul va ko'cha nomlari to'q fonda
 * O'QILADIGAN qilib bo'yalgan. Oddiy OSM plitkasini CSS bilan
 * `filter: invert()` qilish ham mumkin edi, lekin o'shanda yashil
 * bog'lar PUSHTI bo'lib chiqardi va xarita o'qilmas holga kelardi.
 */
const TILES = {
  light: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
    labels: null,
  },
  /**
   * ⚠️ CARTO "Dark Matter" DAN KO'CHIRILDI (2026-11-26): u endi
   * API kalit talab qiladi va kalitsiz so'rovga `200` bilan
   * **"KEY REQUIRED"** yozuvi bosilgan surat qaytaradi. Ya'ni
   * nosozlik JIM: xato ham, bo'sh plitka ham yo'q — xarita
   * shunchaki o'qib bo'lmaydigan bo'lib qoladi va buni faqat
   * ko'z bilan sezish mumkin.
   *
   * ⚠️ KALIT QO'SHILMADI: u `.env` ga yana bitta sir qo'shib,
   * deploy paytida unutilardi va o'shanda xarita AYNI shu holatga
   * tushardi (tashqi tahdid ro'yxatlaridagi `abuse.ch` bilan ayni
   * qaror).
   *
   * ⚠️ ESRI "Dark Gray Canvas" — KALITSIZ va bepul. Lekin u IKKI
   * QATLAM: asos (relyef, suv, yo'l shakllari) va NOMLAR alohida
   * keladi. Faqat asosi olinsa, to'q xaritada bitta ham ko'cha
   * yoki qishloq nomi bo'lmasdi — operator esa "bu qayer" degan
   * savolga javob izlab, mavzuni almashtirishga majbur bo'lardi.
   *
   * ⚠️ `{z}/{y}/{x}` TARTIBI — ESRI DA BOSHQA: OSM da `{z}/{x}/{y}`.
   * Almashtirilsa plitkalar yuklanadi, lekin BOSHQA joyni
   * ko'rsatadi — va bu xato xaritani "siljigan" qilib ko'rsatardi.
   */
  dark: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri, © OpenStreetMap",
    labels:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
  },
} as const;

/** Rangli doira belgi — `divIcon` bilan (rasm fayli kerak emas). */
const dot = (color: string, active = false) => {
  // Tanlangan marker kattaroq va qo'sh halqali — xaritada darhol
  // ko'rinadi.
  const size = active ? 22 : 16;
  const ring = active
    ? `0 0 0 4px ${color}55, 0 1px 6px rgba(0,0,0,.5)`
    : "0 1px 4px rgba(0,0,0,.4)";
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:${ring};cursor:pointer"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function LeafletMap({
  center,
  zoom,
  markers,
  heat,
  areas,
  province,
  dark,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const areaRef = useRef<L.LayerGroup | null>(null);
  const provinceRef = useRef<L.LayerGroup | null>(null);
  const heatRef = useRef<HeatLayer | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  /** ⚠️ Nomlar qatlami — faqat to'q mavzuda (`TILES` izohi). */
  const labelRef = useRef<L.TileLayer | null>(null);
  /** Hudud nomlari (tuman va MFY) — poligonlardan ALOHIDA qatlam. */
  const nameRef = useRef<L.LayerGroup | null>(null);
  /**
   * Yorliq uchun ma'lumot: shakl chegarasi KESHLANADI.
   *
   * ⚠️ HAR ZOOMDA QAYTA HISOBLANMAYDI: `getBounds()` har
   * poligonning hamma nuqtasini aylanib chiqadi va 900 ta shakl
   * uchun u har zoomda sezilarli kechikish berardi.
   */
  const labelDataRef = useRef<{ area: MapArea; bounds: L.LatLngBounds }[]>([]);

  // ── Xaritani bir marta yaratish ─────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: true,
    });

    /**
     * ⚠️ QATLAM TARTIBI MUHIM: MFY poligonlari ENG PASTDA, issiqlik
     * ularning ustida, markerlar esa eng tepada. Teskarisi bo'lsa,
     * poligon markerlarni bosib, ularni bosib bo'lmasdi.
     */
    areaRef.current = L.layerGroup().addTo(map);
    /**
     * ⚠️ VILOYAT KONTURI POLIGONLARDAN YUQORIDA, MARKERLARDAN
     * PASTDA: pastda qolsa, MFY to'ldirishlari uni bosib qo'yardi
     * va rom ko'rinmasdi; tepada bo'lsa esa chiziq ustidagi
     * markerlarni bosib bo'lmasdi.
     */
    provinceRef.current = L.layerGroup().addTo(map);
    heatRef.current = new HeatLayer([]);
    layerRef.current = L.layerGroup().addTo(map);
    /**
     * ⚠️ NOMLAR ENG TEPADA: ular to'liq bo'yalgan
     * poligonlar USTIDA o'qilishi kerak. Markerlar bilan bir
     * qatlamda emas — nomlar zoomda qayta chiziladi va
     * markerlarni ham qayta qurish keraksiz ish bo'lardi.
     */
    nameRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // ⚠️ `invalidateSize`: xarita flex konteynerда yaratilganda
    // Leaflet o'lchamni 0 deb hisoblab, plitkalar yarim yuklanardi
    // yoki kulrang qolardi. Konteyner o'lchami o'zgarganda qayta
    // hisoblaymiz (dastlabki layout + oyna o'lchami).
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    // Dastlabki render tugagach bir marta (flex balandligi hal
    // bo'lgach).
    const raf = requestAnimationFrame(() => map.invalidateSize());

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      areaRef.current = null;
      nameRef.current = null;
      heatRef.current = null;
      tileRef.current = null;
      labelRef.current = null;
    };
    // ⚠️ BIR MARTA: center/zoom o'zgarsa ham xarita qayta
    // yaratilmaydi (foydalanuvchi surgan joyi saqlanadi).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Plitka (mavzuga qarab) ──────────────────────────────────────
  //
  // ⚠️ ALOHIDA EFFEKT: mavzu almashganda butun xaritani qayta
  // yaratish foydalanuvchi surgan joyini va masshtabini yo'qotardi.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = dark ? TILES.dark : TILES.light;

    tileRef.current?.remove();
    labelRef.current?.remove();
    labelRef.current = null;

    tileRef.current = L.tileLayer(source.url, {
      attribution: source.attribution,
      maxZoom: 19,
    }).addTo(map);

    // ⚠️ PLITKA ENG PASTGA: u qatlamlardan keyin qo'shilgani uchun
    // ustiga chiqib qolardi.
    tileRef.current.bringToBack();

    /**
     * ⚠️ NOMLAR QATLAMI — FAQAT TO'Q MAVZUDA (`TILES` izohi): Esri
     * asosida nom yo'q. U ASOS USTIDA, lekin poligonlardan PASTDA
     * turishi kerak — shuning uchun `bringToBack` dan keyin
     * qo'shiladi va o'zi ham orqaga suriladi, asosdan keyin.
     */
    if (source.labels) {
      labelRef.current = L.tileLayer(source.labels, { maxZoom: 19 }).addTo(map);
      labelRef.current.bringToBack();
      tileRef.current.bringToBack();
    }
  }, [dark]);

  // ── Belgilarni yangilash ────────────────────────────────────────
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.clearLayers();
    for (const marker of markers) {
      const m = L.marker([marker.lat, marker.lng], {
        icon: dot(marker.color, marker.active),
      });
      // ⚠️ `onClick` — POPUP O'RNIGA: bosilganda o'ng panel ochiladi.
      if (marker.onClick) m.on("click", marker.onClick);
      else if (marker.popupHtml) m.bindPopup(marker.popupHtml);
      m.addTo(layer);
    }
  }, [markers]);

  // ── Issiqlik qatlami ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const heatLayer = heatRef.current;
    if (!map || !heatLayer) return;

    if (!heat || heat.length === 0) {
      map.removeLayer(heatLayer);
      return;
    }

    heatLayer.setPoints(heat);
    if (!map.hasLayer(heatLayer)) heatLayer.addTo(map);
  }, [heat]);

  /**
   * HUDUD NOMLARI — MASSHTABGA QARAB.
   *
   * ⚠️ MFY NOMLARI HAM CHIZILADI (mijoz so'radi), LEKIN
   * SHAKL EKRANDA YETARLICHA KATTA BO'LGANDAGINA: viloyat
   * masshtabida mahalla bir necha pikselga siqiladi va 900 ta nom
   * bir-birining ustiga chiqib, xaritani BUTUNLAY o'qib
   * bo'lmaydigan qilardi.
   *
   * ⚠️ O'LCHOV PIKSELDA, ZOOM RAQAMIDA EMAS: "zoom 13 dan
   * boshlab ko'rsat" degan shart shahar mahallasiga to'g'ri kelib,
   * qishloq mahallasiga kelmasdi — ularning o'lchami o'nlab
   * barobar farq qiladi. Piksel kengligi esa ikkalasini ham HALOL
   * o'lchaydi: nom sig'adigan shakl nomini oladi.
   *
   * ⚠️ TUMAN NOMI HAR DOIM KO'RINADI: u viloyat
   * masshtabida ham o'qiladi va "bu qaysi tuman" degan savol
   * xaritaning asosiy tayanchi.
   */
  const drawLabels = useCallback(() => {
    const map = mapRef.current;
    const layer = nameRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    for (const { area, bounds } of labelDataRef.current) {
      const isDistrict = area.districtName === "";
      /**
       * ⚠️ TANLANGAN TUMAN HAM "FAOL FON" HISOBLANADI:
       * "Hudud" rejimida uning ichi bo'sh va yorliq ostida uning
       * O'Z MFY lari — ya'ni quyuq yashil — turadi.
       */
      const onActive = area.color === TERRITORY_ACTIVE || Boolean(area.selected);

      if (!isDistrict) {
        /**
         * ⚠️ KENGLIK VA BALANDLIK IKKALASI HAM: faqat
         * kenglik tekshirilsa, ingichka cho'zilgan mahalla (ko'cha
         * bo'ylab) nom olib, u shakldan tashqariga chiqib ketardi.
         */
        const nw = map.latLngToContainerPoint(bounds.getNorthWest());
        const se = map.latLngToContainerPoint(bounds.getSouthEast());
        if (se.x - nw.x < 48 || se.y - nw.y < 18) continue;
      }

      L.marker(bounds.getCenter(), {
        interactive: false,
        icon: L.divIcon({
          className: "",
          html:
            `<span style="white-space:nowrap;font-size:${isDistrict ? 11 : 10}px;` +
            `font-weight:${isDistrict ? 600 : 500};` +
            /*
             * ⚠️ MATN RANGI FON RANGIGA QARAB, MAVZUGA
             * EMAS: faol hudud QUYUQ yashil (`territory-colors.ts`)
             * va unda qora matn o'qilmasdi; och kulrang fonda esa
             * oq matn o'qilmasdi. Halo ham teskari — u matnni
             * chegara chizig'idan ajratadi.
             */
            `color:${onActive ? "#ffffff" : "#0f172a"};` +
            `text-shadow:0 1px 2px ${onActive ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.95)"},` +
            `0 0 3px ${onActive ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.95)"}">` +
            `${escapeHtml(area.name)}</span>`,
          iconSize: [0, 0],
        }),
        opacity: area.dimmed ? 0.55 : 1,
      }).addTo(layer);
    }
  }, [dark]);


  // ── MFY kesimi (poligon yoki doira) ─────────────────────────────
  useEffect(() => {
    const layer = areaRef.current;
    if (!layer) return;

    layer.clearLayers();
    if (!areas || areas.length === 0) return;

    /**
     * ⚠️ ENG KATTASI FAQAT ODDIY POLIGONLARDAN OLINADI (tanlangan
     * va xira bo'lganlari hisobga olinmaydi).
     *
     * Sabab drill-down da: tumanda 400, uning MFY sida 12 ta
     * murojaat bo'ladi. Maxraj tuman sonidan olinsa, tanlangan
     * tuman ichidagi HAMMA MFY eng pastki rangga (yashil) tushib
     * qolardi — ya'ni "qaysi mahallada ko'p" degan savol, aynan
     * drill-down ochadigan savol, javobsiz qolardi.
     */
    const labelData: { area: MapArea; bounds: L.LatLngBounds }[] = [];

    /**
     * ⚠️ FAQAT DOIRA RADIUSI UCHUN QOLDI: chegarasi yo'q MFY doira
     * bilan chiziladi va uning KATTALIGI murojaat soniga bog'liq
     * (rang emas — rang endi ikkita, `territory-colors.ts`).
     */
    const max = Math.max(...areas.map((a) => a.count), 1);

    for (const area of areas) {
      const tooltip = [
        `<b>${escapeHtml(area.name)}</b>`,
        escapeHtml(area.districtName),
        // ⚠️ XIRA TUMANDA SON AYTILMAYDI: nima qilish
        // kerakligi aytiladi — u bosiladigan element.
        area.dimmed ? "<i>ko'rish uchun bosing</i>" : `${area.count} ta murojaat`,
        // ⚠️ TAXMINIYLIK AYTILADI: aks holda operator nuqtani
        // MFY ning haqiqiy markazi deb qabul qilardi.
        area.isApproximate ? "<i>joylashuv taxminiy</i>" : null,
      ]
        .filter(Boolean)
        .join("<br>");

      /**
       * ⚠️ IKKI RANG, SHKALA EMAS (`territory-colors.ts`):
       * tanlangan hudud bitta rangda, qolgani fon. Rang endi
       * "qancha" degan savolga javob bermaydi — son tultipda va
       * yon ro'yxatda.
       *
       * ⚠️ TO'LIQ BO'YALADI (`fillOpacity: 1`): yarim shaffof
       * rang ostidan plitkaning yo'llari ko'rinib, ikki qatlam
       * aralashib ketardi.
       *
       * ⚠️ AJRATUVCHI — CHEGARA: hamma poligon bir xil
       * rangda bo'lgani uchun chiziq QUYUQ va har shaklda
       * ko'rinadi. Usiz qo'shni ikki hudud yagona dog'ga
       * qo'shilib ketardi.
       */
      const style: L.PathOptions = {
        color: TERRITORY_BORDER,
        weight: 1.2,
        opacity: 1,
        fillColor: area.color ?? (area.selected ? TERRITORY_ACTIVE : TERRITORY_BASE),
        fillOpacity: 1,
      };

      /**
       * ⚠️ XIRA HUDUD — AYNI FON RANGI, FAQAT CHEGARASI
       * INGICHKA: alohida kulrang berilsa, uchinchi rang paydo
       * bo'lib, "ikki rang" qoidasi buzilardi. Tanlanganini esa
       * RANGI ajratib turadi, xiraligi emas.
       */
      if (area.dimmed) {
        style.weight = 0.8;
        style.opacity = 0.7;
      }

      if (area.selected) {
        style.color = TERRITORY_BORDER_ACTIVE;
        style.weight = 3;
        /**
         * ⚠️ ICHI FAQAT MFY LARI CHIZILGANDA BO'SH QOLADI
         * ("Hudud" rejimi): ular uni to'liq to'ldiradi.
         *
         * ⚠️ NUQTA/ISSIQLIK REJIMIDA (`outline`) ESA FAOL
         * RANG QOLADI: u yerda MFY chizilmaydi va ichi bo'sh
         * qolsa, aynan diqqat qaratilgan joy xaritadan O'YIB
         * OLINGANDEK ko'rinardi.
         */
        style.fill = Boolean(area.outline);
      }

      if (area.geoJson) {
        const shape = L.geoJSON(area.geoJson as never, { style });
        shape.bindTooltip(tooltip, { sticky: true });
        if (area.onClick) shape.on("click", area.onClick);

        /**
         * ⚠️ SICHQONCHA OSTIDAGI SHAKL YORITILADI — IKKI
         * RANGDA BU MAJBURIY: hamma poligon bir xil rangda va
         * "men qaysi hudud ustidaman" degan savolga javob faqat
         * shundan keladi. Tultip NOMNI aytadi, lekin shaklning
         * CHEGARASI qayergacha ekanini ko'rsatmaydi — ayniqsa
         * MFY lar orasida, ular mayda va zich.
         *
         * ⚠️ TANLANGANI YORITILMAYDI: u allaqachon o'z
         * rangida va yoritilsa, "tanlangan" belgisi yo'qolardi.
         */
        if (!area.selected) {
          /*
           * ⚠️ FAOL SHAKLGA O'Z YORITISHI: uni kulrangga
           * bo'yash "tanlanmagan" degan YOLG'ON belgi berardi.
           */
          const hoverFill =
            style.fillColor === TERRITORY_ACTIVE
              ? TERRITORY_ACTIVE_HOVER
              : TERRITORY_HOVER;

          shape.on("mouseover", () => {
            shape.setStyle({ fillColor: hoverFill, weight: 2 });
          });
          shape.on("mouseout", () => {
            shape.setStyle({ fillColor: style.fillColor, weight: style.weight });
          });
        }

        shape.addTo(layer);

        /**
         * ⚠️ NOMLAR ALOHIDA QATLAMDA, SHU YERDA EMAS: ular
         * MASSHTABGA qarab qayta chiziladi (`drawLabels`) — bu
         * yerda yozilsa, har zoomda butun poligon qatlamini qayta
         * qurish kerak bo'lardi (900 ta shakl).
         */
        labelData.push({ area, bounds: shape.getBounds() });
        continue;
      }

      /**
       * ⚠️ CHEGARA YO'Q — DOIRA. Radius MUROJAAT SONIGA bog'liq:
       * bir xil doiralar "qayerda ko'p" savoliga javob bermasdi va
       * butun qatlamning ma'nosi yo'qolardi.
       */
      if (area.lat === null || area.lng === null) continue;

      const circle = L.circleMarker([area.lat, area.lng], {
        ...style,
        radius: 6 + Math.round((area.count / max) * 18),
      });
      circle.bindTooltip(tooltip, { sticky: true });
      if (area.onClick) circle.on("click", area.onClick);
      circle.addTo(layer);
    }
    labelDataRef.current = labelData;
    drawLabels();
    // ⚠️ `dark` HAM BOG'LIQLIKDA: tanlangan va xira tumanlarning
    // rangi mavzuga qarab o'zgaradi va usiz mavzu almashganda
    // poligonlar eski rangda qolib ketardi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, dark]);

  /**
   * ⚠️ ZOOM O'ZGARGANDA YORLIQLAR QAYTA CHIZILADI:
   * ko'rinadigan nomlar to'plami masshtabga bog'liq (`drawLabels`).
   * Poligonlar esa QAYTA QURILMAYDI — Leaflet ularni o'zi
   * qayta joylashtiradi.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.on("zoomend", drawLabels);
    return () => {
      map.off("zoomend", drawLabels);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark]);

  // ── Viloyat konturi ────────────────────────────────────────────
  useEffect(() => {
    const layer = provinceRef.current;
    if (!layer) return;

    layer.clearLayers();
    if (!province) return;

    L.geoJSON(province as never, {
      style: {
        /**
         * ⚠️ RANG MAVZUGA BOG'LIQ EMAS, LEKIN TO'Q FONDA
         * OCHROQ: qora xaritada quyuq chiziq ko'rinmasdi.
         */
        color: dark ? "#94a3b8" : "#475569",
        weight: 2,
        opacity: 0.85,
        // ⚠️ TO'LDIRISH YO'Q — rom, qatlam emas.
        fill: false,
      },
      /**
       * ⚠️ BOSILMAYDI: rom ustiga bosilganda hech narsa
       * ochilmasligi kerak va u ostidagi marker/poligonning
       * bosilishini to'smasligi ham kerak.
       */
      interactive: false,
    }).addTo(layer);
  }, [province, dark]);

  return <div ref={containerRef} className={className} />;
}
