"use client";

/**
 * XARITA — LEAFLET + OpenStreetMap.
 *
 * ── NIMA UCHUN LEAFLET, GOOGLE MAPS EMAS ──────────────────────────────
 *
 * ⚠️ KALIT KERAK EMAS VA HISOB-KITOB YO'Q. Google Maps har
 * ko'rsatish uchun pul oladi va kalitni `.env` ga qo'yishni talab
 * qiladi — ya'ni ilovani ishga tushirish uchun yana bitta tashqi
 * hisob ochish kerak bo'lardi. OpenStreetMap bepul va ochiq.
 *
 * ⚠️ `react-leaflet` ISHLATILMADI: u React versiyasiga QATTIQ
 * bog'langan (har major React uchun alohida major) va Next 16 +
 * React 19 bilan birga ishlatish uchun versiya moslashtirish
 * kerak bo'lardi. Leaflet'ning o'zi — oddiy imperativ kutubxona
 * va uni `useEffect` ichida boshqarish 40 qator kod.
 *
 * ⚠️ FAQAT MIJOZ TOMONIDA: Leaflet `window` ga murojaat qiladi va
 * server renderida `ReferenceError` bilan butun sahifani
 * yiqitardi. Shuning uchun u `dynamic(..., { ssr: false })` orqali
 * yuklanadi (`map-view.tsx`).
 */

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

/**
 * ⚠️ XARITA MARKAZI — ANDIJON. `0,0` dan boshlansa, koordinatasiz
 * ochilgan xarita Atlantika okeanining o'rtasini ko'rsatardi.
 *
 * ⚠️ QIYMAT PANELDA O'Z JOYIDA (mobil ilovadagi `limits.ts` dan
 * NUSXA EMAS): ikki repo mustaqil va ular orasida umumiy paket
 * chiqarish bu hajmdagi loyiha uchun ortiqcha.
 */
const DEFAULT_CENTER: [number, number] = [40.7821, 72.3442];
const DEFAULT_ZOOM = 11;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  onClick?: () => void;
}

interface Props {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  /** Markazdagi qadalgan nuqta — joy TANLASH rejimi. */
  picker?: boolean;
  /** Xarita siljiganda markaz koordinatasi. */
  onMove?: (lat: number, lng: number) => void;
  className?: string;
}

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = "© OpenStreetMap";

export default function LeafletMap({
  center,
  zoom = DEFAULT_ZOOM,
  markers = [],
  picker = false,
  onMove,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  /**
   * ⚠️ `onMove` NI `ref` DA USHLAB TURAMIZ: u har renderda yangi
   * funksiya bo'ladi va `useEffect` bog'liqligiga qo'yilsa, xarita
   * HAR renderda qayta yaratilardi — foydalanuvchi uni surganda
   * joyiga qaytib ketardi.
   */
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  // ── XARITANI YARATISH (bir marta) ────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: center ?? DEFAULT_CENTER,
      zoom,
      // ⚠️ `zoomControl` O'CHIRILGAN: telefonda ikki barmoq bilan
      // kattalashtiriladi va tugmalar faqat joyni egallab,
      // xaritaning bir qismini yopib turardi.
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    if (onMoveRef.current) {
      // ⚠️ `moveend`, `move` EMAS: `move` sekundiga o'nlab marta
      // ishlaydi va har safar React holatini yangilash xaritani
      // "qotib qolgan" qilardi.
      map.on("moveend", () => {
        const point = map.getCenter();
        onMoveRef.current?.(point.lat, point.lng);
      });

      /**
       * ⚠️ BOSHLANG'ICH MARKAZ DARHOL XABAR QILINADI (joy tanlash
       * rejimida). Sabab: qadalgan nuqta EKRANDA KO'RINIB TURADI
       * va foydalanuvchi "joy tanlangan" deb hisoblaydi. Agar
       * koordinata faqat xarita SURILGANDA yozilsa, nuqtani
       * to'g'ri joyda deb topgan odam hech narsa surmay davom
       * etardi — va murojaat JOYSIZ ketardi, ekranda esa nuqta
       * turgan bo'lardi.
       *
       * Ya'ni qoida: ekranda ko'rinayotgan narsa va saqlanadigan
       * qiymat HAR DOIM bir xil.
       */
      if (picker) {
        const start = map.getCenter();
        onMoveRef.current(start.lat, start.lng);
      }
    }

    /**
     * ⚠️ O'LCHAM QAYTA HISOBLANADI: xarita yashirin elementda
     * (pastdan chiqadigan oyna, tab) yaratilsa, Leaflet uning
     * balandligini 0 deb biladi va kulrang maydon ko'rsatardi.
     */
    const timer = setTimeout(() => map.invalidateSize(), 120);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── MARKAZNI TASHQARIDAN O'ZGARTIRISH ────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;

    const current = map.getCenter();
    // ⚠️ SEZILARLI FARQ BO'LGANDAGINA KO'CHIRILADI: aks holda
    // `onMove` → holat → `center` → `setView` → `moveend` cheksiz
    // halqasi hosil bo'lardi.
    if (Math.abs(current.lat - center[0]) < 1e-6 && Math.abs(current.lng - center[1]) < 1e-6) {
      return;
    }

    map.setView(center, map.getZoom());
  }, [center]);

  // ── NUQTALAR ─────────────────────────────────────────────────
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.clearLayers();

    for (const marker of markers) {
      const icon = L.divIcon({
        className: "",
        // ⚠️ `divIcon` — RASM EMAS: Leaflet standart belgisi
        // alohida PNG fayllarni yuklaydi va ular Next'ning
        // `_next/static` yo'lida topilmay, xaritada "siniq rasm"
        // ko'rinardi. Bu klassik Leaflet + bundler muammosi.
        html: `<span class="pin" style="background:${marker.color}"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const item = L.marker([marker.lat, marker.lng], { icon }).addTo(layer);
      if (marker.onClick) item.on("click", marker.onClick);
    }
  }, [markers]);

  return (
    <div className={className} style={{ position: "relative" }}>
      <div ref={containerRef} className="h-full w-full" />

      {picker ? (
        /*
          ⚠️ QADALGAN NUQTA XARITANING USTIDA, UNING ICHIDA EMAS:
          foydalanuvchi XARITANI suradi, nuqtani emas. Nuqtani
          surish telefonda barmoq ostida qolib, qayerga
          qo'yayotganini ko'rsatmasdi.
        */
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="-mt-6 flex flex-col items-center">
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" aria-hidden>
              <path
                d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24c0-8.837-7.163-16-16-16z"
                fill="hsl(var(--destructive))"
              />
              <circle cx="16" cy="15" r="5.5" fill="white" />
            </svg>
            <span className="mt-1 h-1.5 w-4 rounded-full bg-black/20 blur-[1px]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
