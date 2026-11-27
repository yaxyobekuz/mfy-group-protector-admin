/**
 * TUMAN → MFY DRILL-DOWN — POLIGONLARNI YIG'ADI (YAGONA MANBA).
 *
 * ⚠️ IKKI SAHIFA AYNI XATTI-HARAKATNI TALAB QILADI: `/map`
 * (nuqtalar/issiqlik bilan bir qatorda "Hudud" rejimi) va boshqaruv
 * panelidagi "Xarita" tabi (`district-map-panel`). Mantiq nusxa
 * olinsa, bittasida "xira tuman bosiladi" yoki "MFY lar ustida
 * chiziladi" qoidasi o'zgarib, ikkinchisi eskirardi — va farqni
 * faqat ikkala sahifani yonma-yon ochgan odam sezardi.
 *
 * ⚠️ RANG VA USLUB BU YERDA EMAS (`leaflet-map.tsx`): bu modul
 * faqat "qaysi poligon, qaysi holatda" degan savolga javob beradi.
 * Uslub ham bu yerga ko'chirilsa, xaritaning o'zi ikki joydan
 * boshqarilardi.
 */

import type { MapArea } from "./leaflet-map";
import { TERRITORY_ACTIVE } from "./territory-colors";

interface DistrictInput {
  id: string;
  name: string;
  geoJson: unknown;
}

interface MahallaInput {
  id: string;
  name: string;
  district: { id: string; name: string };
  lat: number | null;
  lng: number | null;
  geoJson: unknown;
  isApproximate?: boolean;
}

interface Options<M extends MahallaInput> {
  /** Chegarasi bor tumanlar (`/territory/boundaries`). */
  districts: DistrictInput[];
  /** MFY kesimi (`/reports/mahalla-map`). */
  mahallas: M[];
  /** Ochilgan tuman id'si — `null` bo'lsa viloyat ko'rinishi. */
  openDistrict: string | null;
  /**
   * TUMANNING SONI.
   *
   * ⚠️ TASHQARIDAN KELADI, CHUNKI IKKI SAHIFADA IKKI XIL: `/map`
   * uni MFY lardan yig'adi (tanlangan yo'nalish chiplari bo'yicha),
   * panel esa `/reports/district-map` dagi TANLANGAN
   * KO'RSATKICHDAN oladi (murojaat, signal, xavfsizlik...).
   */
  districtCount: (district: DistrictInput) => number;
  /** MFY ning soni — drill-down ichida. */
  mahallaCount: (mahalla: M) => number;
  /** Tuman bosilganda. */
  onOpen: (districtId: string) => void;
  /**
   * FAQAT CHEGARA REJIMI — nuqtalar va issiqlik uchun.
   *
   * ⚠️ RANG BARIBIR BERILADI, lekin to'ldirish YENGIL bo'ladi
   * (`leaflet-map.tsx#outline`): tumanlar ko'rinadi, nuqtalar esa
   * ularning ustida o'qiladi.
   */
  outline?: boolean;
}

export const buildTerritoryAreas = <M extends MahallaInput>({
  districts,
  mahallas,
  openDistrict,
  districtCount,
  mahallaCount,
  onOpen,
  outline = false,
}: Options<M>): MapArea[] => {
  const base: MapArea[] = districts.map((district) => ({
    id: district.id,
    name: district.name,
    // ⚠️ Tuman kesimida ustki daraja — viloyatning o'zi.
    districtName: "",
    count: districtCount(district),
    lat: null,
    lng: null,
    geoJson: district.geoJson,
    /**
     * ⚠️ RANG BU YERDA BERILMAYDI: u HOLATDAN kelib chiqadi
     * (tanlangan / tanlanmagan) va uni `leaflet-map.tsx` o'zi
     * qo'yadi. Bu yerda ham yozilsa, "ikki rang" qoidasi ikki
     * joydan boshqarilardi.
     */
    outline,
    /**
     * ⚠️ TANLANGAN TUMAN "faqat chegara" REJIMIDA EMAS: nuqtalar
     * rejimida ham tanlangani to'liq ko'rinishi kerak, aks holda
     * uni qo'shnilaridan ajratib bo'lmasdi.
     */
    selected: district.id === openDistrict,
    dimmed: openDistrict !== null && district.id !== openDistrict,
    // ⚠️ XIRA TUMAN HAM BOSILADI: qo'shnisiga o'tish uchun avval
    // viloyatga qaytish kerak bo'lmasin.
    onClick: () => onOpen(district.id),
  }));

  /**
   * ⚠️ "FAQAT CHEGARA" REJIMIDA MFY LAR UMUMAN QO'SHILMAYDI:
   * nuqtalar/issiqlik ustiga 90 ta poligon chizilsa, o'sha
   * rejimlarning mazmuni — nuqtalar va dog' — butunlay ko'milib
   * ketardi.
   */
  if (openDistrict === null || outline) return base;

  /**
   * ⚠️ TUMANLAR AVVAL, MFY LAR KEYIN: Leaflet poligonlarni
   * QO'SHILISH TARTIBIDA chizadi va teskarisi bo'lsa, tanlangan
   * tumanning chegarasi o'z MFY larini bosib qolardi.
   */
  const inside: MapArea[] = mahallas
    .filter((item) => item.district.id === openDistrict)
    .map((item) => ({
      id: item.id,
      name: item.name,
      districtName: item.district.name,
      count: mahallaCount(item),
      lat: item.lat,
      lng: item.lng,
      geoJson: item.geoJson,
      isApproximate: item.isApproximate,
      /**
       * ⚠️ OCHILGAN TUMAN ICHIDAGI MFY LAR — FAOL RANGDA:
       * "aktiv / inaktiv" belgisini aynan ULAR tashiydi. Tumanning
       * o'zi ichi bo'sh chegara bo'lib qoladi (uni MFY lari
       * to'ldiradi), ya'ni faol rang unga berilsa KO'RINMASDI —
       * va xaritada ochilgan tuman qo'shnilaridan umuman
       * ajralmasdi.
       */
      color: TERRITORY_ACTIVE,
    }));

  return [...base, ...inside];
};

/**
 * KESIMNI TASHIYDIGAN POLIGONLAR — sanoq va bo'sh holat uchun.
 *
 * ⚠️ XIRA VA TANLANGAN TUMANLAR CHIQARIB TASHLANADI: ular fon
 * vazifasini bajaradi. Qoldirilsa, ochilgan tumanda "16 / 16 ta"
 * degan son turib, ekranda MFY lar ko'rinardi.
 */
export const visibleTerritoryAreas = (areas: MapArea[]): MapArea[] =>
  areas.filter((area) => !area.selected && !area.dimmed);
