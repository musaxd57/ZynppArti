/**
 * Çizgi kalınlığı hiyerarşisi + palet token'ları (VISUAL-CRAFT §1/§6).
 *
 * "Profesyonel görünüm"ün tek en büyük kaynağı tutarlı çizgi kalınlığı hiyerarşisidir (ISO 128):
 * kesilen duvar en kalın → oda çevresi orta → mobilya/ölçü ince → ızgara/hatch en ince.
 *
 * Değerler **ekran pikseli** cinsindendir; dünya birimine çevirmek için `pixelSize` (= 1/zoom) ile
 * çarpılır → çizgiler her zoom'da aynı ekran kalınlığında kalır (zoom'la şişmez). Duvar GÖVDESİ
 * ise fiziksel (cm, dünya birimi) kalır — o gerçek kalınlıktır, ölçeklenmesi doğrudur.
 */

/** Hiyerarşi — ekran px (ISO 128 mm kademelerinin ekran karşılığı). */
export const LINEWEIGHTS = {
  /** Kesilen duvar konturu — en kalın. */
  cut: 1.6,
  /** Oda/mahal çevresi, görünen kenar — orta. */
  perimeter: 1.1,
  /** Mobilya, ölçü, simge — ince. */
  thin: 0.7,
  /** Izgara, hatch, ikincil — en ince (hairline). */
  hairline: 0.5,
} as const;

/**
 * Koyu, sakin tuval paleti (VISUAL-CRAFT §6). Zemin koyu; çizimler öne çıkar, UI geri çekilir.
 * Koyu zeminde "poché" tersine döner: duvar gövdesi açık dolgu, kenarı tanımlı.
 */
export const PALETTE = {
  background: 0x1e1e1e,
  /** Duvar gövdesi (poché) — açık, masif. */
  wallBody: 0xdedede,
  /** Duvar kesit konturu — gövdeyi tanımlayan kenar. */
  wallEdge: 0xb0b0b0,
  /** Mahal dolgusu (yarı saydam). */
  roomFill: 0x4a90d9,
  roomFillAlpha: 0.1,
  /** Mahal çevre çizgisi — orta kalınlık. */
  roomPerimeter: 0x7fb0e0,
  /** Ölçülendirme çizgisi/metni — ince, nötr açık. */
  dimension: 0xc8c8d0,
  /** Izgara ince çizgileri (en ince, geri planda). */
  grid: 0x2a2a2a,
  /** Izgara ana çizgileri (her 1 m) — incelerden biraz belirgin. */
  gridMajor: 0x383838,
  /** Eksen (x/y) — ızgaradan biraz belirgin. */
  axis: 0x3b5168,
} as const;
