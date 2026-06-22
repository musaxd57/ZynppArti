import {
  polygonArea,
  polygonMinWidth,
  distanceToPolygonBoundary,
  pointInPolygon,
} from '@zynpparti/geometry';
import {
  centerlineAreaM2,
  roomTypeOf,
  type Opening,
  type Parcel,
  type Space,
  type Wall,
} from '@zynpparti/document';
import {
  DAYLIGHT_REGULATION,
  PARCEL_CONTAINMENT_REGULATION,
  PARKING_REGULATION,
  REGULATIONS,
  TAKS_REGULATION,
  citationOf,
} from './regulations';

/**
 * Kaynak-gösteren öneri motoru (Faz 2, ADR-0014 ayak 1). Deterministik geometrik kurallar
 * modeli denetler; her bulgu HANGİ kurala/ölçüye dayandığını gösterir (atıflı).
 *
 * Seviye 1 (AI-AGENT-VISION §2): salt-okunur öneri — modeli DEĞİŞTİRMEZ. LLM doğal-dil katmanı
 * (ADR-0006 provider adapter) sağlayıcı/maliyet kararından sonra bunun üstüne biner.
 */

export type Severity = 'error' | 'warning' | 'info';

export interface Finding {
  readonly severity: Severity;
  /** Türkçe, ölçüt + ölçülen değeri içeren açıklama. */
  readonly message: string;
  /** Atıf metni ("Kaynak — kural"). */
  readonly citation: string;
  /** İlgili mahal (varsa) — panelde tıklayıp odaklamak için. */
  readonly entityId?: string;
}

function fmtM2(m2: number): string {
  return `${m2.toFixed(1).replace('.', ',')} m²`;
}

/** Sirkülasyon mahalleri TS 9111 koridor genişliğini sağlıyor mu? */
function checkCorridorWidth(spaces: readonly Space[]): Finding[] {
  const reg = REGULATIONS.corridorWidth;
  const out: Finding[] = [];
  for (const s of spaces) {
    if (roomTypeOf(s) !== 'circulation') continue;
    const widthCm = polygonMinWidth(s.boundary);
    if (widthCm > 0 && widthCm < reg.min) {
      out.push({
        severity: 'error',
        message: `"${s.name}" koridor genişliği ~${Math.round(widthCm)} cm; en az ${reg.min} cm gerekli.`,
        citation: citationOf(reg),
        entityId: s.id,
      });
    }
  }
  return out;
}

/** Oda tipine göre İmar asgari alan kuralı (yatak/oturma/mutfak). */
const MIN_AREA_BY_TYPE = {
  sleeping: REGULATIONS.bedroomMinArea,
  living: REGULATIONS.livingMinArea,
  kitchen: REGULATIONS.kitchenMinArea,
} as const;

/** Yatma/yaşam/mutfak mahalleri İmar Yönetmeliği asgari alanını sağlıyor mu? */
function checkRoomMinArea(spaces: readonly Space[]): Finding[] {
  const out: Finding[] = [];
  for (const s of spaces) {
    const reg = MIN_AREA_BY_TYPE[roomTypeOf(s) as keyof typeof MIN_AREA_BY_TYPE];
    if (!reg) continue;
    const area = centerlineAreaM2(s);
    if (area < reg.min) {
      out.push({
        severity: 'warning',
        message: `"${s.name}" alanı ${fmtM2(area)}; asgari ${fmtM2(reg.min)} bekleniyor.`,
        citation: citationOf(reg),
        entityId: s.id,
      });
    }
  }
  return out;
}

/** Yaşanabilir oda (yatma/yaşam) en küçük net genişliği İmar asgarisini sağlıyor mu? (info — plana göre değişir) */
function checkRoomMinWidth(spaces: readonly Space[]): Finding[] {
  const reg = REGULATIONS.roomMinWidth;
  const out: Finding[] = [];
  for (const s of spaces) {
    const t = roomTypeOf(s);
    if (t !== 'sleeping' && t !== 'living') continue;
    const widthCm = polygonMinWidth(s.boundary);
    if (widthCm > 0 && widthCm < reg.min) {
      out.push({
        severity: 'info',
        message: `"${s.name}" en dar net genişlik ~${Math.round(widthCm)} cm; yaşanabilir oda için ~${reg.min} cm beklenir (plana göre değişir).`,
        citation: citationOf(reg),
        entityId: s.id,
      });
    }
  }
  return out;
}

/**
 * Yapı parsel sınırları içinde mi? Bir duvarın herhangi bir ucu parsel poligonu dışındaysa
 * taşma bulgusu üretir. Parsel yoksa denetlenmez. Etkilenen duvar sayısı özetlenir (gürültüsüz).
 */
function checkParcelContainment(walls: readonly Wall[], parcels: readonly Parcel[]): Finding[] {
  const rings = parcels.filter((p) => p.boundary.length >= 3);
  if (rings.length === 0 || walls.length === 0) return [];
  const inAnyParcel = (p: { x: number; y: number }): boolean =>
    rings.some((parcel) => pointInPolygon(p, parcel.boundary));
  let outside = 0;
  for (const w of walls) {
    if (!inAnyParcel(w.start) || !inAnyParcel(w.end)) outside++;
  }
  if (outside === 0) return [];
  return [
    {
      severity: 'warning',
      message: `${outside} duvar parsel sınırının dışına taşıyor görünüyor — yapı parsel içinde kalmalı.`,
      citation: `${PARCEL_CONTAINMENT_REGULATION.source} — ${PARCEL_CONTAINMENT_REGULATION.rule}`,
    },
  ];
}

/** Banyo/WC/ıslak hacimde erişilebilir dönüş alanı (TS 9111, ~150 cm) — bilgi (advisory). */
function checkBathroomAccess(spaces: readonly Space[]): Finding[] {
  const reg = REGULATIONS.bathroomTurning;
  const out: Finding[] = [];
  for (const s of spaces) {
    const t = roomTypeOf(s);
    if (t !== 'bathroom' && t !== 'wet') continue;
    const widthCm = polygonMinWidth(s.boundary);
    if (widthCm > 0 && widthCm < reg.min) {
      out.push({
        severity: 'info',
        message: `"${s.name}" en dar ~${Math.round(widthCm)} cm; erişilebilir WC için ~${reg.min} cm dönüş alanı önerilir.`,
        citation: citationOf(reg),
        entityId: s.id,
      });
    }
  }
  return out;
}

/** Banyo net alanı İmar asgarisini sağlıyor mu? (değer sürüme göre değişebilir → info, ADR-0021). */
function checkBathroomMinArea(spaces: readonly Space[]): Finding[] {
  const reg = REGULATIONS.bathroomMinArea;
  const out: Finding[] = [];
  for (const s of spaces) {
    if (roomTypeOf(s) !== 'bathroom') continue;
    const area = centerlineAreaM2(s);
    if (area > 0 && area < reg.min) {
      out.push({
        severity: 'info',
        message: `"${s.name}" banyo alanı ${fmtM2(area)}; İmar'da tipik asgari ~${fmtM2(reg.min)}.`,
        citation: citationOf(reg),
        entityId: s.id,
      });
    }
  }
  return out;
}

/**
 * TAKS (taban alanı / parsel) — parsel varsa kaba oranı bilgi olarak verir; tipik üst sınırı
 * (~%40) aşıyorsa hatırlatır. Taban alanı = mahal alanları toplamı (tek kat varsayımı, kaba).
 */
function checkTaks(spaces: readonly Space[], parcels: readonly Parcel[]): Finding[] {
  if (parcels.length === 0 || spaces.length === 0) return [];
  const parcelM2 = parcels.reduce((sum, p) => sum + polygonArea(p.boundary) / 10000, 0);
  if (parcelM2 <= 0) return [];
  const footprintM2 = spaces.reduce((sum, s) => sum + centerlineAreaM2(s), 0);
  if (footprintM2 <= 0) return [];
  const ratio = footprintM2 / parcelM2;
  const pct = Math.round(ratio * 100);
  const overTypical = ratio > TAKS_REGULATION.typicalMax;
  return [
    {
      severity: 'info',
      message: overTypical
        ? `TAKS (kaba) ≈ %${pct}; konutta tipik üst sınır ~%${Math.round(TAKS_REGULATION.typicalMax * 100)} — imar planı notunuzu kontrol edin.`
        : `TAKS (kaba) ≈ %${pct} (taban/parsel; tek kat varsayımı).`,
      citation: `${TAKS_REGULATION.source} — ${TAKS_REGULATION.rule}`,
    },
  ];
}

/** Açıkça yükseklik atanmış duvarlar İmar asgari kat yüksekliğini sağlıyor mu? (info — plana göre değişir) */
function checkCeilingHeight(walls: readonly Wall[]): Finding[] {
  const reg = REGULATIONS.ceilingHeight;
  const low = walls.filter((w) => w.height != null && w.height > 0 && w.height < reg.min);
  if (low.length === 0) return [];
  const minH = Math.min(...low.map((w) => w.height as number));
  return [
    {
      severity: 'info',
      message: `${low.length} duvarın yüksekliği < ${reg.min} cm (en düşük ~${Math.round(minH)} cm); konutta asgari net kat yüksekliği ~${reg.min} cm beklenir.`,
      citation: citationOf(reg),
    },
  ];
}

/** Kapı net geçiş genişliği TS 9111 erişilebilirlik asgarisini sağlıyor mu? */
function checkDoorWidth(openings: readonly Opening[]): Finding[] {
  const reg = REGULATIONS.doorClearWidth;
  const out: Finding[] = [];
  for (const o of openings) {
    if (o.kind !== 'door') continue;
    if (o.width < reg.min) {
      out.push({
        severity: 'warning',
        message: `Kapı net geçişi ${Math.round(o.width)} cm; erişilebilirlik için en az ${reg.min} cm önerilir.`,
        citation: citationOf(reg),
        entityId: o.id,
      });
    }
  }
  return out;
}

/**
 * Çekme mesafesi (İmar) — yapının parsel sınırına en yakın mesafesi asgari çekmeyi sağlıyor mu?
 * Bina düzeyi yaklaşım: ön/arka/yan ayrımı yapılmaz (plan gerektirir), en küçük mesafe yan-asgariyle
 * (3 m) kıyaslanır. Parsel yoksa denetlenmez.
 */
function checkSetback(walls: readonly Wall[], parcels: readonly Parcel[]): Finding[] {
  if (parcels.length === 0 || walls.length === 0) return [];
  const reg = REGULATIONS.setbackSide;
  let minDist = Infinity;
  for (const parcel of parcels) {
    if (parcel.boundary.length < 3) continue;
    for (const w of walls) {
      minDist = Math.min(
        minDist,
        distanceToPolygonBoundary(w.start, parcel.boundary),
        distanceToPolygonBoundary(w.end, parcel.boundary),
      );
    }
  }
  if (!Number.isFinite(minDist) || minDist >= reg.min) return [];
  return [
    {
      severity: 'warning',
      message: `Yapı parsel sınırına ~${Math.round(minDist)} cm; asgari çekme ~${reg.min} cm (ön/arka daha fazla olabilir).`,
      citation: citationOf(reg),
    },
  ];
}

/**
 * Doğal aydınlatma (İmar) — bina düzeyinde pencere alanı / taban alanı oranı (KABA).
 * Pencere yoksa nag etmez (kullanıcı henüz pencere koymamış olabilir).
 */
function checkDaylight(spaces: readonly Space[], openings: readonly Opening[]): Finding[] {
  const reg = DAYLIGHT_REGULATION;
  const windows = openings.filter((o) => o.kind === 'window');
  if (windows.length === 0) return [];
  const floorM2 = spaces.reduce((s, sp) => s + centerlineAreaM2(sp), 0);
  if (floorM2 <= 0) return [];
  const winM2 = windows.reduce((s, w) => s + (w.width / 100) * (reg.windowHeightCm / 100), 0);
  const ratio = winM2 / floorM2;
  if (ratio < reg.minRatio) {
    return [
      {
        severity: 'warning',
        message: `Doğal aydınlatma (kaba): pencere/taban ≈ %${Math.round(ratio * 100)}; en az ~%${Math.round(reg.minRatio * 100)} beklenir.`,
        citation: `${reg.source} — ${reg.rule}`,
      },
    ];
  }
  return [];
}

/**
 * Otopark ihtiyacı (Otopark Yönetmeliği) — toplam alandan KABA tahmin (info).
 * Gerçek ihtiyaç kullanım/bölge/nüfusa göredir; bu basitleştirilmiş bir tohumdur.
 */
function checkParking(spaces: readonly Space[]): Finding[] {
  if (spaces.length === 0) return [];
  const totalM2 = spaces.reduce((sum, s) => sum + centerlineAreaM2(s), 0);
  if (totalM2 <= 0) return [];
  const needed = Math.ceil(totalM2 / PARKING_REGULATION.areaPerSpaceM2);
  return [
    {
      severity: 'info',
      message: `Toplam ~${Math.round(totalM2)} m² için kaba otopark tahmini: ~${needed} araç (bölge/kullanıma göre değişir).`,
      citation: `${PARKING_REGULATION.source} — ${PARKING_REGULATION.rule}`,
    },
  ];
}

/**
 * Tüm copilot denetimlerini çalıştırır. Saf fonksiyon — model + duvarlar girer, bulgular çıkar.
 * Çizim değişince yeniden çağrılır (canlı öneri). Sıra: hata/uyarı önce, bilgi (otopark) sonda.
 *
 * NOT: Ön bahçe çekmesi (setbackFront) hâlâ tohum — ön/arka kenar ayrımı imar planı/cephe yönü
 * gerektirir; setbackSide (asgari) parsel ile aktiftir (ADR-0018).
 */
export function runCopilotChecks(
  spaces: readonly Space[],
  walls: readonly Wall[],
  openings: readonly Opening[] = [],
  parcels: readonly Parcel[] = [],
): Finding[] {
  return [
    ...checkCorridorWidth(spaces),
    ...checkRoomMinArea(spaces),
    ...checkRoomMinWidth(spaces),
    ...checkBathroomMinArea(spaces),
    ...checkBathroomAccess(spaces),
    ...checkDoorWidth(openings),
    ...checkCeilingHeight(walls),
    ...checkDaylight(spaces, openings),
    ...checkParcelContainment(walls, parcels),
    ...checkSetback(walls, parcels),
    ...checkTaks(spaces, parcels),
    ...checkParking(spaces),
  ];
}
