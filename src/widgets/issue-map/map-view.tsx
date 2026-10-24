"use client";

/**
 * ⚠️ XARITA FAQAT MIJOZDA YUKLANADI (`ssr: false`): Leaflet
 * `window` ga murojaat qiladi va server renderida
 * `ReferenceError` bilan butun sahifani yiqitardi.
 *
 * ⚠️ ALOHIDA FAYL: `dynamic(...)` ni ishlatuvchi komponent ichida
 * chaqirish har renderda YANGI dinamik komponent yaratardi va
 * xarita har holat o'zgarishida noldan qayta yuklanardi.
 */

import dynamic from "next/dynamic";

import { Spinner } from "@/shared/ui/states";

export const MapView = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <Spinner />
    </div>
  ),
});

export type { MapMarker } from "./leaflet-map";
