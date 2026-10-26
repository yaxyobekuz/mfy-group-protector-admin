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
 */

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

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

interface Props {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  className?: string;
}

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

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

export default function LeafletMap({ center, zoom, markers, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // ── Xaritani bir marta yaratish ─────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

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
    };
    // ⚠️ BIR MARTA: center/zoom o'zgarsa ham xarita qayta
    // yaratilmaydi (foydalanuvchi surgan joyi saqlanadi).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return <div ref={containerRef} className={className} />;
}
