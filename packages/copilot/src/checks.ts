import { polygonMinWidth } from '@zynpparti/geometry';
import { centerlineAreaM2, roomTypeOf, type Space, type Wall } from '@zynpparti/document';
import { PARKING_REGULATION, REGULATIONS, citationOf } from './regulations';

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

/** Yatma/yaşam mahalleri İmar Yönetmeliği asgari alanını sağlıyor mu? */
function checkRoomMinArea(spaces: readonly Space[]): Finding[] {
  const out: Finding[] = [];
  for (const s of spaces) {
    const type = roomTypeOf(s);
    const reg =
      type === 'sleeping'
        ? REGULATIONS.bedroomMinArea
        : type === 'living'
          ? REGULATIONS.livingMinArea
          : null;
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
 * NOT: Çekme mesafesi (parsel sınırı) ve kapı genişliği (Opening entity) kuralları bilgi tabanında
 * hazır ama denetimleri ilgili entity'ler eklenince aktifleşir (ADR-0018; regulations.ts status).
 */
export function runCopilotChecks(spaces: readonly Space[], _walls: readonly Wall[]): Finding[] {
  return [...checkCorridorWidth(spaces), ...checkRoomMinArea(spaces), ...checkParking(spaces)];
}
