import { resolveChain, classifyDesignTier } from './router';
import { DESIGN_TIMEOUT_MS, withTimeout } from './timeout';
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

/** AI'ın önerdiği kapı/pencere — bir duvar üzerindeki nokta (istemci en yakın duvara bağlar). */
export interface LayoutOpening {
  readonly kind: 'door' | 'window';
  /** Boşluğun (duvar üzerindeki) merkez noktası (cm). */
  readonly cx: number;
  readonly cy: number;
  readonly width: number;
}

export interface Layout {
  readonly summary: string;
  /** Duvar segmentleri [x1,y1,x2,y2] (cm). Komşu odalar duvarı paylaşır. */
  readonly walls: readonly [number, number, number, number][];
  readonly rooms: readonly LayoutRoom[];
  readonly openings: readonly LayoutOpening[];
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
  '  "rooms": [{"name":"Salon","type":"living","cx":200,"cy":150}, ...],',
  '  "openings": [{"kind":"door","cx":400,"cy":300,"width":90}, {"kind":"window","cx":200,"cy":0,"width":120}, ...]',
  '}',
  'openings: kapı/pencere. cx/cy bir DUVARIN ÜZERİNDE nokta. kind ALANINI DOĞRU SEÇ:',
  '  • İKİ ODAYI birbirine bağlayan İÇ duvardaki boşluk = "door" (geçiş). Her odanın en az bir kapısı olmalı.',
  '  • Yalnız DIŞ duvardaki (binanın çevresi) boşluk = "window" (yaşam mahalleri için ışık).',
  'Kapı genişliği ~80-100, pencere ~100-150 cm. İç boşlukları YANLIŞLIKLA "window" yapma — bunlar kapıdır.',
  '',
  'ZORUNLU — GİRİŞ KAPISI: Her planda TAM BİR adet DIŞ giriş kapısı ekle (kind:"door", DIŞ duvar üzerinde,',
  '  genişlik ~90-100). Bu kapı bir antre/hol/koridora (sirkülasyon mahalline) açılmalı; doğrudan yatak',
  '  odası/banyoya açmayan bir konum seç. Bir evin dışarıdan girişi olmadan plan GEÇERSİZDİR. Kullanıcı',
  '  AÇIKÇA "giriş yok / iç mekan / tek oda" demedikçe giriş kapısını ASLA atlama.',
  '',
  'GERÇEKÇİLİK (öncelikli): Gerçek, yaşanabilir bir konut gibi tasarla:',
  '  • Girişte bir antre/hol olsun; sirkülasyon (hol/koridor) odaları birbirine bağlasın (geçiş-odası yapma).',
  '  • Islak hacimleri (mutfak + banyo/wc) tesisat için yan yana / yakın konumla.',
  '  • Yatak odalarını girişten uzakta, özel bölgede grupla; salonu girişe/yaşam alanına yakın koy.',
  '  • Her yatak odasının ve salonun dış cephede en az bir penceresi olsun; banyo şaftla havalanabilir.',
  '  • Oda oranları gerçekçi: salon en büyük, banyo küçük, koridor dar.',
  'type değerleri: living | kitchen | bathroom | wet | sleeping | circulation | service | other.',
  'Her odaya anlamlı, BAĞLAMA UYGUN Türkçe ad ver; adsız oda BIRAKMA. Odalar illa "Yatak Odası" olmak',
  '  zorunda değil — tarife göre Oturma Odası, Çalışma Odası, Misafir Odası, Çocuk Odası, Ebeveyn Yatak',
  '  Odası vb. olabilir. "X+1" = X oda + 1 salon (X oda genelde yatak odasıdır ama tarif aksini söylüyorsa',
  '  başka tür oda yap; ör. 3+1 = 3 oda + salon).',
  'Ölçüler tarife uysun; verilmezse makul al (oda kenarı ~250-450 cm). Tüm sayılar tam sayı (cm).',
  'rooms[].cx/cy o odanın İÇİNDE bir nokta olmalı.',
  'Kullanıcı TOPLAM ALAN (m²) belirttiyse, odaların toplam alanı buna yakın olsun (±%10).',
  'Sana "[Bağlam: ...]" ile kullanılabilir parsel ölçüsü verilirse plan o sınırlara SIĞMALI (taşma yok).',
].join('\n');

/** Azami duvar sayısı — taslak için fazlasıyla yeter; aşırısı senkron findFaces'i (O(n²)) dondurur. */
const MAX_WALLS = 600;
/** Azami koordinat büyüklüğü (cm) — ~10 km; bunun ötesi saçma + zoom/indeks'i bozar. */
const MAX_COORD = 1_000_000;
/** Azami oda etiketi — taslak için fazlasıyla yeter; aşırısı istemcide oda-başına point-in-polygon'u dondurur. */
const MAX_ROOMS = 300;
/** Azami özet uzunluğu — modelin devasa summary döndürüp istemci/yanıtı şişirmesini engeller. */
const MAX_SUMMARY = 280;

/** Bir sayının geçerli, sonlu ve makul büyüklükte koordinat olduğunu doğrular. */
function num(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= MAX_COORD;
}

/**
 * LLM metnindeki TÜM dengeli {...} JSON bloklarını sırayla çıkarıp ayrıştırır (markdown/önek metne
 * toleranslı). STRING-FARKINDA: bir string literal içindeki `}` (ör. summary "salon } var") derinliği
 * yanlışlıkla sıfırlamasın diye in-string + backslash-escape durumunu izler.
 *
 * Neden TÜM bloklar (yalnız ilki değil): model planı, geçerli-ama-layout-OLMAYAN bir objenin (ör.
 * `{"note":"..."}`) ARDINDAN yazabiliyor. İlk parse-edilebilir blokta durup orada validation başarısız
 * olursa gerçek plan atlanırdı → çağıran her bloğu validate edip ilk GEÇERLİ olanı seçsin (denetim bulgusu).
 */
function extractJsonBlocks(text: string): unknown[] {
  const out: unknown[] = [];
  let start = text.indexOf('{');
  while (start >= 0) {
    let depth = 0;
    let inStr = false;
    let esc = false;
    let parsed: unknown | null = null;
    let end = -1;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          try {
            parsed = JSON.parse(text.slice(start, i + 1));
          } catch {
            parsed = null;
          }
          break;
        }
      }
    }
    if (parsed !== null) out.push(parsed); // {...} JSON.parse'ı asla null dönmez → başarı işareti
    if (end < 0) break; // dengeli blok kapanmadı → daha fazla blok yok
    start = text.indexOf('{', end + 1);
  }
  return out;
}

/** Ayrıştırılmış bir nesneyi geçerli bir Layout'a doğrular (saf; null = geçersiz). */
function validateLayout(parsed: unknown): Layout | null {
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
  if (walls.length > MAX_WALLS) return null; // aşırı/saldırgan çıktı → reddet (UI'yi dondurma)

  const rawRooms = Array.isArray(obj.rooms) ? obj.rooms : [];
  const rooms: LayoutRoom[] = [];
  for (const r of rawRooms) {
    if (typeof r !== 'object' || r === null) continue;
    const rr = r as Record<string, unknown>;
    // Boş/yalnız-boşluk ad reddedilir (adsız mahal üretmesin); ad 60 karaktere sınırlanır.
    const name = typeof rr.name === 'string' ? rr.name.trim() : '';
    if (name.length > 0 && num(rr.cx) && num(rr.cy)) {
      rooms.push({
        name: name.slice(0, 60),
        type: typeof rr.type === 'string' ? rr.type : undefined,
        cx: rr.cx,
        cy: rr.cy,
      });
    }
    if (rooms.length >= MAX_ROOMS) break; // aşırı/saldırgan çıktı → UI'yi (point-in-polygon × oda) dondurma
  }

  const rawOpenings = Array.isArray(obj.openings) ? obj.openings : [];
  const openings: LayoutOpening[] = [];
  for (const o of rawOpenings) {
    if (typeof o !== 'object' || o === null) continue;
    const oo = o as Record<string, unknown>;
    const kind = oo.kind === 'door' || oo.kind === 'window' ? oo.kind : null;
    if (!kind || !num(oo.cx) || !num(oo.cy)) continue;
    // Asgari makul genişlik 50cm; altındaki (ör. 0.5) çizim hatasıdır → tipe göre varsayılana düş.
    const width =
      num(oo.width) && oo.width >= 50 ? Math.min(oo.width, 1000) : kind === 'door' ? 90 : 120;
    openings.push({ kind, cx: oo.cx, cy: oo.cy, width });
    if (openings.length >= 200) break; // güvenlik sınırı
  }

  const rawSummary = typeof obj.summary === 'string' ? obj.summary.trim().slice(0, MAX_SUMMARY) : '';
  const summary = rawSummary.length > 0 ? rawSummary : 'Taslak plan üretildi.';
  return { summary, walls, rooms, openings };
}

/** Tek bir plan ayrıştırır (geriye dönük uyum + tekil mod). İlk GEÇERLİ bloğu seçer. */
export function parseLayout(text: string): Layout | null {
  for (const block of extractJsonBlocks(text)) {
    const l = validateLayout(block);
    if (l) return l;
  }
  return null;
}

/**
 * Bir veya çok plan ayrıştırır. LLM `{"variants":[plan, plan]}` döndürdüyse hepsini, tek plan
 * döndürdüyse onu tek elemanlı dizi olarak verir. Geçersiz varyantlar elenir. Bloklar sırayla denenir →
 * ilk GEÇERLİ varyant-dizisi ya da tekil plan kazanır (önündeki layout-olmayan objeler atlanır).
 */
export function parseLayouts(text: string): Layout[] {
  for (const block of extractJsonBlocks(text)) {
    if (block && typeof block === 'object') {
      const variants = (block as Record<string, unknown>).variants;
      if (Array.isArray(variants)) {
        const valid = variants.map(validateLayout).filter((l): l is Layout => l !== null);
        if (valid.length > 0) return valid;
      }
    }
    const single = validateLayout(block);
    if (single) return [single];
  }
  return [];
}

export interface DesignVariantsResult {
  readonly variants: Layout[];
  readonly provider: AiProviderName;
  readonly model: string;
}

/**
 * Birden çok alternatif plan üretir (Faz 4 kabul kriteri: "≥2 varyant, kullanıcı seçer"). Tek LLM
 * çağrısı; model `{variants:[...]}` döndürür (maliyet için tek istek). En az 1 geçerli varyant
 * üreten ilk sağlayıcı kazanır; yoksa sıradakine geçer.
 */
export async function askDesignVariants(
  providers: Partial<Record<AiProviderName, AiProvider>>,
  prompt: string,
  forced?: AiProviderName,
  hint?: string,
  count = 2,
  signal?: AbortSignal,
): Promise<DesignVariantsResult> {
  const available = Object.keys(providers) as AiProviderName[];
  // Basit → Akash-önce (ucuz; geçersizse Claude'a düşer), gelişmiş → Claude-önce.
  const order = resolveChain(classifyDesignTier(prompt), available, forced);
  const chain = order.length > 0 ? order : available;
  const baseContent = hint ? `${prompt}\n\n[Bağlam: ${hint}]` : prompt;
  const userContent = `${baseContent}\n\nÖNEMLİ: ${count} FARKLI alternatif plan üret (farklı yerleşim/oda düzeni). Yanıtı {"variants":[plan1, plan2]} biçiminde döndür; her plan yukarıdaki şemaya uysun.`;

  let lastErr: unknown;
  for (const name of chain) {
    const provider = providers[name];
    if (!provider) continue;
    const t = withTimeout(DESIGN_TIMEOUT_MS, signal);
    try {
      const text = await provider.chat([{ role: 'user', content: userContent }], {
        system: DESIGN_SYSTEM,
        maxTokens: 6000,
        signal: t.signal,
      });
      const variants = parseLayouts(text).slice(0, count);
      if (variants.length > 0) return { variants, provider: name, model: provider.model };
      lastErr = new Error(`Sağlayıcı "${name}" geçerli varyant üretemedi.`);
    } catch (e) {
      lastErr = e;
    } finally {
      t.dispose();
    }
    console.error('Varyant üretimi başarısız, sıradaki sağlayıcı:', lastErr);
  }
  throw lastErr ?? new Error('Tasarım varyantı üretilemedi.');
}
