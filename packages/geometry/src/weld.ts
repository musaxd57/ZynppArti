/**
 * Dik-açılı (yatay/düşey) duvar taslaklarının uçlarını ORTAK çizgilere hizalama.
 *
 * Neden: AI/LLM kat planı üretirken duvar uçlarını birkaç cm kaydırabiliyor → köşeler tam buluşmuyor,
 * iç duvarlar dış duvara değmiyor (T-bağlantıda boşluk). Buluşması gereken koordinatlar `tol` içinde
 * yakınsa onları tek değere çekersek köşeler/T-bağlantılar kapanır. (Çizim motoru duvarları ayrı
 * dörtgenler çizdiği için, uçlar aynı çizgiye oturunca dörtgenler örtüşür ve boşluk kalmaz.)
 *
 * Saf veri — DOM/render bilgisi içermez (CLAUDE.md §0.8). Yalnız dik planlar için; çapraz duvar nadir
 * olduğundan koordinat-bazlı kümeleme onların açısını az miktarda kaydırabilir (taslak için kabul).
 */

/** Bir duvar segmenti: [x1, y1, x2, y2] (cm). */
export type Seg4 = readonly [number, number, number, number];

/**
 * Değerleri `tol` toleransıyla kümeler; her değeri ait olduğu kümenin ORTALAMASINA eşleyen bir
 * arama fonksiyonu döner. Kümeleme zincirlemesini önlemek için bir küme en fazla `tol` kadar genişler
 * (üye, kümenin ilk elemanından en çok `tol` uzakta olabilir).
 */
function clusterValues(values: readonly number[], tol: number): (v: number) => number {
  const sorted = [...values].sort((a, b) => a - b);
  const map = new Map<number, number>();
  let i = 0;
  while (i < sorted.length) {
    const anchor = sorted[i]!;
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1]! - anchor <= tol) j++;
    let sum = 0;
    for (let k = i; k <= j; k++) sum += sorted[k]!;
    const mean = sum / (j - i + 1);
    for (let k = i; k <= j; k++) map.set(sorted[k]!, mean);
    i = j + 1;
  }
  return (v) => map.get(v) ?? v;
}

/**
 * Tüm segment uçlarının X'lerini (ve ayrı olarak Y'lerini) `tol` ile kümeleyip her koordinatı kümesinin
 * ortalamasına çeker → "buluşması gereken" uçlar aynı çizgiye oturur. Çıktı girdiyle aynı sırada.
 */
export function snapSegmentsToGrid(segs: readonly Seg4[], tol: number): Seg4[] {
  if (segs.length === 0 || tol <= 0) return segs.map((s) => [...s] as unknown as Seg4);
  const snapX = clusterValues(
    segs.flatMap((s) => [s[0], s[2]]),
    tol,
  );
  const snapY = clusterValues(
    segs.flatMap((s) => [s[1], s[3]]),
    tol,
  );
  return segs.map(([x1, y1, x2, y2]) => [snapX(x1), snapY(y1), snapX(x2), snapY(y2)] as Seg4);
}
