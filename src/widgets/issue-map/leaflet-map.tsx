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
import { useEffect, useRef } from "react";

import { HeatLayer, type HeatPoint } from "./heat-layer";

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
}

interface Props {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  heat?: HeatPoint[];
  areas?: MapArea[];
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
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap, © CARTO",
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

/**
 * MFY RANGI — MUROJAAT SONIGA QARAB.
 *
 * ⚠️ ENG KATTASIGA NISBATAN: mutlaq chegara qo'yilsa (masalan "10 dan
 * ko'p — qizil"), kichik tumanda hamma MFY ko'k, kattasida esa hammasi
 * qizil bo'lardi — ikkala holatda ham xarita hech narsa ko'rsatmasdi.
 */
const areaColor = (count: number, max: number): string => {
  if (count === 0) return "#64748b";

  const ratio = count / Math.max(max, 1);
  if (ratio > 0.75) return "#ef4444";
  if (ratio > 0.5) return "#f97316";
  if (ratio > 0.25) return "#eab308";
  return "#22c55e";
};

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function LeafletMap({
  center,
  zoom,
  markers,
  heat,
  areas,
  dark,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const areaRef = useRef<L.LayerGroup | null>(null);
  const heatRef = useRef<HeatLayer | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);

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
    heatRef.current = new HeatLayer([]);
    layerRef.current = L.layerGroup().addTo(map);

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
      heatRef.current = null;
      tileRef.current = null;
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
    tileRef.current = L.tileLayer(source.url, {
      attribution: source.attribution,
      maxZoom: 19,
    }).addTo(map);

    // ⚠️ PLITKA ENG PASTGA: u qatlamlardan keyin qo'shilgani uchun
    // ustiga chiqib qolardi.
    tileRef.current.bringToBack();
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

  // ── MFY kesimi (poligon yoki doira) ─────────────────────────────
  useEffect(() => {
    const layer = areaRef.current;
    if (!layer) return;

    layer.clearLayers();
    if (!areas || areas.length === 0) return;

    const max = Math.max(...areas.map((area) => area.count), 1);

    for (const area of areas) {
      const color = areaColor(area.count, max);
      const tooltip = [
        `<b>${escapeHtml(area.name)}</b>`,
        escapeHtml(area.districtName),
        `${area.count} ta murojaat`,
        // ⚠️ TAXMINIYLIK AYTILADI: aks holda operator nuqtani
        // MFY ning haqiqiy markazi deb qabul qilardi.
        area.isApproximate ? "<i>joylashuv taxminiy</i>" : null,
      ]
        .filter(Boolean)
        .join("<br>");

      const style: L.PathOptions = {
        color,
        weight: 1.5,
        opacity: 0.9,
        // ⚠️ SONI NOL BO'LSA DEYARLI SHAFFOF: bo'sh MFY xaritani
        // bo'yab, "ko'p" joylarni ko'rsatmay qo'yardi.
        fillOpacity: area.count === 0 ? 0.08 : 0.35,
        fillColor: color,
      };

      /**
       * ⚠️ TAXMINIY MARKAZ UZUK CHIZIQ BILAN: aniq chegara bilan
       * taxminiy doirani bir xil ko'rsatish xaritaga ortiqcha
       * ishonch berardi.
       */
      if (area.isApproximate) style.dashArray = "4 3";

      if (area.geoJson) {
        const shape = L.geoJSON(area.geoJson as never, { style });
        shape.bindTooltip(tooltip, { sticky: true });
        if (area.onClick) shape.on("click", area.onClick);
        shape.addTo(layer);
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
  }, [areas]);

  return <div ref={containerRef} className={className} />;
}
