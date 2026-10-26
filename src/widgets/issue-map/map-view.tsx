"use client";

/**
 * XARITA O'RAMI — Leaflet'ni SSR'siz yuklaydi.
 *
 * ⚠️ `ssr: false` MAJBURIY: Leaflet `window` ga murojaat qiladi va
 * server renderida butun sahifani yiqitardi.
 */

import dynamic from "next/dynamic";

import type { MapMarker } from "./leaflet-map";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Xarita yuklanmoqda…
    </div>
  ),
});

interface Props {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  /** O'ram div klasslari (joylashuv/o'lcham). Leaflet konteyner — ICHIDA. */
  className?: string;
}

/**
 * ⚠️ TASHQI O'RAM joylashuvni (`fixed`, `z-0`, o'lcham) oladi; Leaflet
 * konteyner ichida `h-full w-full` bo'ladi. Shunday ajratish globals'даги
 * `.leaflet-container` z-index qoidasi joylashuv bilan urishmasligi
 * uchun — leaflet klassi faqat ICHKI div'ga tushadi.
 */
export const MapView = ({ className, ...rest }: Props) => (
  <div className={className}>
    <LeafletMap {...rest} className="h-full w-full" />
  </div>
);
export type { MapMarker };
