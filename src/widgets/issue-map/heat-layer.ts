/**
 * ISSIQLIK QATLAMI (тепловая карта) — O'Z ICHIMIZDA.
 *
 * ── NIMA UCHUN YANGI PAKET QO'SHILMADI ────────────────────────────────
 *
 * ⚠️ `leaflet.heat` KLASSIK TANLOV, LEKIN U QO'SHILMADI va sabab
 * `searchable-select.tsx` dagi bilan AYNI: butun xatti-harakat 150
 * qatorga sig'adi, yangi bog'liqlik esa panelning build hajmiga
 * qo'shiladi va yillab qo'llab-quvvatlanishi kerak. `leaflet.heat`
 * 2015-yildan beri yangilanmagan va uning `@types` i ham yo'q.
 *
 * ── QANDAY ISHLAYDI ───────────────────────────────────────────────────
 *
 * Har nuqta uchun markazdan chetga SO'NUVCHI doira chiziladi
 * (`createRadialGradient`), hammasi bir-birining ustiga qo'yiladi
 * (`globalAlpha`) va natijada paydo bo'lgan KULRANG ZICHLIK xaritasi
 * rangga aylantiriladi (ko'k → yashil → sariq → qizil).
 *
 * ⚠️ RANG ALOHIDA BOSQICHDA: gradientni to'g'ridan-to'g'ri rangli
 * chizsak, ikki nuqta ustma-ust tushganda ranglar ARALASHIB, ma'nosiz
 * tus berardi. Zichlikni oldin o'lchab, keyin bo'yash "issiqlik"
 * tushunchasini to'g'ri beradi.
 *
 * ⚠️ `L.Layer` DAN MEROS, `L.Canvas` EMAS: bizga Leaflet'ning o'z
 * chizish quvuri kerak emas — bitta `canvas` yetarli va uni to'liq
 * o'zimiz boshqaramiz.
 */

import L from "leaflet";

export interface HeatPoint {
  lat: number;
  lng: number;
  /** ⚠️ Og'irlik: bitta MFY da 40 ta murojaat bo'lsa, u 40 marta "issiq". */
  weight?: number;
}

/**
 * ⚠️ RADIUS PIKSELDA, METRDA EMAS: masshtab o'zgarganda issiqlik
 * dog'ining EKRANDAGI o'lchami o'zgarmasligi kerak — aks holda
 * uzoqdan qaraganda butun viloyat bitta qizil dog'ga aylanardi.
 */
const RADIUS = 28;
const BLUR = 18;

/**
 * RANG SHKALASI — KO'KDAN QIZILGACHA.
 *
 * ⚠️ BOSHI SHAFFOF: zichligi nol joylar xaritani KO'RSATISHI kerak,
 * aks holda issiqlik qatlami butun ekranni ko'k parda bilan yopib
 * qo'yardi.
 *
 * ⚠️ TO'Q FONDA O'QILADI: panel qorong'i mavzuda ishlaydi va och
 * ko'k/yashil tuslar u yerda ko'rinmasdi.
 */
const SCALE: [number, number, number, number][] = [
  [0.0, 59, 130, 246], // ko'k
  [0.35, 34, 197, 94], // yashil
  [0.6, 250, 204, 21], // sariq
  [0.8, 249, 115, 22], // to'q sariq
  [1.0, 239, 68, 68], // qizil
];

const colorAt = (value: number): [number, number, number] => {
  for (let i = 1; i < SCALE.length; i += 1) {
    const [stop, r, g, b] = SCALE[i]!;
    const [prevStop, pr, pg, pb] = SCALE[i - 1]!;

    if (value <= stop) {
      const t = stop === prevStop ? 0 : (value - prevStop) / (stop - prevStop);
      return [
        Math.round(pr + (r - pr) * t),
        Math.round(pg + (g - pg) * t),
        Math.round(pb + (b - pb) * t),
      ];
    }
  }

  const last = SCALE[SCALE.length - 1]!;
  return [last[1], last[2], last[3]];
};

/** Bitta nuqtaning so'nuvchi dog'i — bir marta yasalib, qayta ishlatiladi. */
const stamp = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const size = RADIUS * 2;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const gradient = ctx.createRadialGradient(
    RADIUS,
    RADIUS,
    0,
    RADIUS,
    RADIUS,
    RADIUS,
  );
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return canvas;
};

export class HeatLayer extends L.Layer {
  private canvas: HTMLCanvasElement | null = null;
  private points: HeatPoint[] = [];
  private readonly brush = stamp();

  constructor(points: HeatPoint[] = []) {
    super();
    this.points = points;
  }

  setPoints(points: HeatPoint[]): this {
    this.points = points;
    this.redraw();
    return this;
  }

  onAdd(map: L.Map): this {
    const canvas = L.DomUtil.create("canvas", "leaflet-heat-layer") as HTMLCanvasElement;
    canvas.style.position = "absolute";
    // ⚠️ BOSISHNI O'TKAZADI: aks holda issiqlik qatlami ostidagi
    // markerlarni bosib bo'lmasdi.
    canvas.style.pointerEvents = "none";

    this.canvas = canvas;
    map.getPanes().overlayPane?.appendChild(canvas);

    map.on("moveend zoomend resize", this.redraw, this);
    this.redraw();

    return this;
  }

  onRemove(map: L.Map): this {
    map.off("moveend zoomend resize", this.redraw, this);
    this.canvas?.remove();
    this.canvas = null;
    return this;
  }

  private redraw = (): void => {
    const map = (this as unknown as { _map?: L.Map })._map;
    const canvas = this.canvas;
    if (!map || !canvas) return;

    const size = map.getSize();
    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);

    canvas.width = size.x;
    canvas.height = size.y;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size.x, size.y);
    if (this.points.length === 0) return;

    /**
     * ⚠️ OG'IRLIK ENG KATTASIGA NISBATAN O'LCHANADI: mutlaq son
     * bilan bo'yalsa, 5 ta murojaatli viloyat butunlay ko'k,
     * 500 talikda esa hammasi qizil bo'lardi — ikkala holatda ham
     * xarita HECH NARSA ko'rsatmasdi.
     */
    const max = Math.max(...this.points.map((point) => point.weight ?? 1), 1);

    // ── 1-bosqich: zichlik (kulrang) ──────────────────────────────
    for (const point of this.points) {
      const { x, y } = map.latLngToContainerPoint([point.lat, point.lng]);

      // Ekrandan tashqaridagi nuqtalar chizilmaydi.
      if (x < -RADIUS || y < -RADIUS || x > size.x + RADIUS || y > size.y + RADIUS) {
        continue;
      }

      ctx.globalAlpha = Math.max(0.08, Math.min(1, (point.weight ?? 1) / max));
      ctx.drawImage(this.brush, x - RADIUS, y - RADIUS);
    }

    ctx.globalAlpha = 1;

    // ── 2-bosqich: zichlikni RANGGA aylantirish ───────────────────
    //
    // ⚠️ YUQORIDAGI IZOH: rang alohida bosqichda beriladi, aks holda
    // ustma-ust tushgan nuqtalarda ranglar aralashib ketardi.
    const image = ctx.getImageData(0, 0, size.x, size.y);
    const data = image.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]!;
      if (alpha === 0) continue;

      const value = Math.min(1, alpha / 255);
      const [r, g, b] = colorAt(value);

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      // ⚠️ SHAFFOFLIK CHEGARALANADI: to'liq qoramtir dog' ostidagi
      // ko'cha nomlari o'qilmay qolardi.
      data[i + 3] = Math.min(190, alpha + BLUR);
    }

    ctx.putImageData(image, 0, 0);
  };
}
