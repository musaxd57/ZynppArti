import { resolveChain } from './router';
import type { AiProvider, AiProviderName } from './types';

/**
 * AI tasarım taslağı üretimi (Fikir 2 — erken/deneysel önizleme, Moses talebiyle geliştirme amaçlı).
 * Kullanıcı tarif eder ("8x6 m, 2 oda, parkeli salon"); LLM **katı JSON** bir kat planı döndürür
 * (cm cinsinden duvar segmentleri + oda etiketleri). İstemci bunu Command sistemiyle çizer →
 * undo'lanabilir (model yalnız Command ile değişir — kutsal kural korunur).
 *
 * NOT: Tam üretici Faz 4'tür; bu basit dikdörtgensel taslak. Karmaşık iş → "complex" kademe (en iyi
 * model). Sağlam JSON için katı sistem yönergesi + toleranslı ayrıştırma (ilk dengeli {...} bloğu).
 */

export interface LayoutRoom {
  readonly name: string;
  readonly type?: string;
  /** Oda merkezi (cm) — çizimden sonra mahale ad/tip atamak için. */
  readonly cx: number;
  readonly cy: number;
}

export interface Layout {
  readonly summary: string;
  /** Duvar segmentleri [x1,y1,x2,y2] (cm). Komşu odalar duvarı paylaşır. */
  readonly walls: readonly [number, number, number, number][];
  readonly rooms: readonly LayoutRoom[];
}

export interface DesignResult extends Layout {
  readonly provider: AiProviderName;
  readonly model: string;
}

export const DESIGN_SYSTEM = [
  'Sen bir mimari kat planı taslak üreticisisin.',
  'Kullanıcının tarifine göre BASİT, dikdörtgensel bir kat planı üret.',
  '',
  'ÇIKTI: SADECE geçerli JSON döndür — başka metin, açıklama, markdown YOK.',
  'Birim: santimetre (cm). Koordinat: x sağa, y aşağı artar; (0,0) sol-üsttür.',
  'Duvarlar düz çizgi parçalarıdır. KOMŞU ODALAR ARASINDAKİ duvarı yalnız BİR KEZ yaz (paylaşılır).',
  'Tüm odalar kapalı dikdörtgenler oluşturmalı (duvarlar birleşmeli).',
  '',
  'JSON ŞEMASI:',
  '{',
  '  "summary": "tek cümle Türkçe özet",',
  '  "walls": [[x1,y1,x2,y2], ...],',
  '  "rooms": [{"name":"Salon","type":"living","cx":200,"cy":150}, ...]',
  '}',
  'type değerleri: living | kitchen | bathroom | wet | sleeping | circulation | service | other.',
  'Ölçüler tarife uysun; verilmezse makul al (oda kenarı ~250-450 cm). Tüm sayılar tam sayı (cm).',
  'rooms[].cx/cy o odanın İÇİNDE bir nokta olmalı.',
].join('\n');

/** Bir sayının geçerli sonlu sayı olduğunu doğrular. */
function num(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * LLM metninden ilk dengeli {...} JSON bloğunu çıkarır + Layout'a doğrular. Geçersizse null.
 * (Model bazen JSON'u ```json bloğuna sarar ya da önüne metin koyar → toleranslı.)
 */
export function parseLayout(text: string): Layout | null {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  const rawWalls = Array.isArray(obj.walls) ? obj.walls : [];
  const walls: [number, number, number, number][] = [];
  for (const w of rawWalls) {
    if (!Array.isArray(w) || w.length !== 4) continue;
    const x1 = w[0];
    const y1 = w[1];
    const x2 = w[2];
    const y2 = w[3];
    if (!num(x1) || !num(y1) || !num(x2) || !num(y2)) continue;
    if (x1 === x2 && y1 === y2) continue; // dejenere (sıfır uzunluk) atla
    walls.push([x1, y1, x2, y2]);
  }
  if (walls.length === 0) return null; // çizilecek duvar yoksa başarısız

  const rawRooms = Array.isArray(obj.rooms) ? obj.rooms : [];
  const rooms: LayoutRoom[] = [];
  for (const r of rawRooms) {
    if (typeof r !== 'object' || r === null) continue;
    const rr = r as Record<string, unknown>;
    if (typeof rr.name === 'string' && num(rr.cx) && num(rr.cy)) {
      rooms.push({
        name: rr.name,
        type: typeof rr.type === 'string' ? rr.type : undefined,
        cx: rr.cx,
        cy: rr.cy,
      });
    }
  }

  const summary = typeof obj.summary === 'string' ? obj.summary : 'Taslak plan üretildi.';
  return { summary, walls, rooms };
}

/**
 * Tasarım taslağı üretir: complex kademe zinciri (en iyi model) ile dener; ilk geçerli JSON'u döndürür.
 * Her sağlayıcı için ayrıştırma başarısız olursa sıradakine geçer (JSON üretemeyen modele takılmaz).
 */
export async function askDesign(
  providers: Partial<Record<AiProviderName, AiProvider>>,
  prompt: string,
  forced?: AiProviderName,
): Promise<DesignResult> {
  const available = Object.keys(providers) as AiProviderName[];
  const order = resolveChain('complex', available, forced);
  const chain = order.length > 0 ? order : available;

  let lastErr: unknown;
  for (const name of chain) {
    const provider = providers[name];
    if (!provider) continue;
    try {
      const text = await provider.chat([{ role: 'user', content: prompt }], {
        system: DESIGN_SYSTEM,
        maxTokens: 4000,
      });
      const layout = parseLayout(text);
      if (layout) return { ...layout, provider: name, model: provider.model };
      lastErr = new Error(`Sağlayıcı "${name}" geçerli plan JSON üretemedi.`);
    } catch (e) {
      lastErr = e;
    }
    console.error('Tasarım üretimi başarısız, sıradaki sağlayıcı:', lastErr);
  }
  throw lastErr ?? new Error('Tasarım üretilemedi.');
}
