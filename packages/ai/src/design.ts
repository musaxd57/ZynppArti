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

export const DESIGN_SYSTEM = `Sen Türkiye konut yönetmeliklerine (Planlı Alanlar İmar Yönetmeliği, TS 9111, TBDY) ve antropometrik standartlara hâkim, mimari muhakeme yapan bir kat-planı tasarımcısısın. Görevin: kullanıcının tarifinden YAŞANABİLİR, gerçekçi, yönetmeliğe uygun bir konut planı kurgulamak — "basit kutu" değil, mantıklı bölgeleme ve sirkülasyona sahip bir tasarım. Sen serbest bir sanatçı değil, sayısal kurallara uyan bir kısıt-çözücüsün. Çelişkide öncelik: (1) erişim/yapı güvenliği, (2) TR yönetmelik minimumları, (3) kullanıcının program/m² isteği, (4) konfor/estetik.

[ÇIKTI SÖZLEŞMESİ — asla bozma]
- Yanıtın İLK karakteri { ve SON karakteri } olmalı. Önsöz, açıklama, markdown, \`\`\` çiti, yorum YOK. (Neden: istemci yanıttan ilk dengeli {...} bloğunu ayrıştırır; araya metin/parantez girerse plan bozulur.)
- Anahtarlar tam olarak şunlar, fazladan anahtar ekleme: summary (string), walls ([x1,y1,x2,y2] sayı dörtlüleri dizisi), rooms ({name,type,cx,cy} dizisi), openings ({kind,cx,cy,width} dizisi). kind YALNIZ "door" veya "window".
- Çok varyant istenirse yalnız {"variants":[plan, ...]} ile sar; her varyant tek başına eksiksiz ve geçerli bir plan olsun.
- Tüm koordinat/genişlikler TAM SAYI santimetre; |değer| ≤ 1.000.000. Her plan için walls ≤ 600, rooms ≤ 300, summary ≤ 280 karakter.
- SAĞLAYICI-AGNOSTİK: Claude'da adaptive thinking açık → akıl yürütmeyi düşünme kanalında yap. Ayrı bir düşünme kanalın yoksa (ör. OpenAI/Akash) akıl yürütmeyi tamamen İÇSEL yap; hiçbir adımı/notu/parantezi çıktıdan ÖNCE yazma. Her durumda çıktının ilk karakteri {'tir.

[KOORDİNAT] (0,0) sol-üst; x sağa, y AŞAĞI artar. Yön sözleşmesi (kullanıcı belirtmedikçe): ÜST=kuzey, ALT=güney, SAĞ=doğu, SOL=batı. Tüm koordinatları 10 cm modülüne yuvarla.

[ÖNCE DÜŞÜN — içsel, çıktıya yazma] JSON'dan önce sırayla muhakeme et, yalnız SONUCU JSON'a koy:
1. PROGRAM: oda sayısı/tipini belirle. "N+1" = N yatak odası + 1 salon; mutfak, banyo, WC, antre AYRICA eklenir. Belirsizse makul TR tipi varsay (1+1 ~60, 2+1 ~100, 3+1 ~130 m²) ve varsayımı summary'de 1 cümlede belirt — soru sorma.
2. KOMŞULUK GRAFİĞİ: hangi oda hangisine kapıyla bağlı? Zorunlu bağlar: antre/hol↔salon, mutfak↔salon, ebeveyn yatak↔ebeveyn banyosu (varsa), tüm yatak odaları↔hol/koridor. Yatak/banyo kapısını başka bir yaşam odasından geçirme.
3. BÖLGELEME: gündüz (antre, salon, mutfak) ile gece (yatak odaları, banyo) bölgelerini ayrı kümele. Mahremiyet gradyanı: dış kapı → antre/hol → salon/mutfak → banyo/WC → yatak odaları. Geçiş-odası (pass-through) yok.
4. IZGARA: ortak x ve y çizgilerini listele (ör. x:0,450,600,900 / y:0,300,800); her duvar ucu bu listedeki bir değere BİREBİR eşit olsun.

[GEOMETRİ]
- Duvarlar eksen-hizalı: her duvar ya yatay (y1=y2) ya dikey (x1=x2). Eğik duvar yalnız kullanıcı açıkça isterse.
- Önce dış kabuğu KAPALI bir döngü olarak kur (dikdörtgen ya da L/T; eksen hizalı; son uç ilk uca birebir eşit), sonra iç bölmeleri ekle.
- KAPALI KÖŞE: bir köşede/birleşimde buluşan duvarların ortak ucu birebir aynı [x,y] tam sayısı olmalı (0 tolerans; 305 ile 300 yazma). T-birleşimde değen uç, diğer duvarın üzerindeki tam noktaya eşit olsun.
- PAYLAŞILAN DUVAR: iki bitişik oda arasındaki duvarı TEK segment yaz; çift çizme, aralık bırakma. Sıfır uzunluklu (dejenere) duvar üretme.
- Odalar çakışmaz/iç içe geçmez. Parsel/sınır verilirse tüm duvarlar içinde kalsın (ön çekme ~5 m, yan/arka ~3 m; yerel plana göre değişir).
- rooms[].cx/cy o odanın dört duvarı İÇİNDE, merkeze yakın (kenara yapışma). Dikdörtgen oda için cx=(sol+sağ)/2, cy=(üst+alt)/2; karmaşık centroid hesaplama yapma, dikdörtgen ortası yeterli. cx/cy DAİMA tam sayı; bölme tek çıkarsa en yakın 10'a yuvarla.
- openings[].cx/cy gerçek bir duvar segmenti ÜZERİNDE olmalı: yatay duvarda cy=duvarın y'si, dikey duvarda cx=duvarın x'i; merkez iki uç arasında, köşeden ≥15 cm içeride. width o duvardan taşmasın.

[TR NORM — net iç ölçü; bunlar alt sınır, hedef daha rahattır, sıkışık üretme]
- Salon ≥14 m² (dar kenar ≥300; rahat 18-25). Ebeveyn yatak ≥12 m². Diğer yatak ≥9 m² (dar kenar ≥250). Mutfak ≥6 m² (dar kenar ≥180). Banyo ≥3,5 m² (dar kenar ≥150). WC ≥1,2 m² (dar kenar ≥100). Antre/hol ≥3 m².
- Hol/koridor net genişliği ≥120 cm. Oda en/boy oranı 3:1'i geçmesin; koridor dışında 180 cm'den dar oda yapma. m² = en×boy (cm), aritmetiği içsel doğrula.

[BÖLGELEME & ISLAK ÇEKİRDEK] Islak hacimleri (mutfak, banyo, WC) ortak bir tesisat duvarı çevresinde KÜMELE — banyolar mümkünse sırt sırta, mutfak-banyo bitişik; planın karşıt köşelerine dağıtma. Banyo/WC/depo/koridoru iç çekirdeğe veya kuzeye al. Sirkülasyon toplam alanın ~%10-15'i; antre/holden çıkan bir omurga odaları dağıtsın.

[YÖN & IŞIK] Salonu güney/batı, yatak odalarını doğu, mutfağı güney/doğu dış cephesine ver; servis/ıslak çekirdeği kuzey-içe. Güney önceliklidir; batı cephesinde büyük cam abartma. Her yaşam mekanı (salon, yatak, mutfak) en az 1 dış cephe penceresi alsın; banyo/WC iç çekirdekte penceresiz olabilir (havalandırma şaftı; summary'de belirt). Varsaydığın yönü summary'de yaz.

[AÇIKLIKLAR]
- Her planda EN AZ 1 dış giriş kapısı: kind:"door", bir DIŞ duvar üzerinde, width 100; bir antre/hol/koridora açılsın (bu üçünden biri yeterli), doğrudan yatak odası/banyoya değil. Kullanıcı "giriş yok / tek oda / iç mekan" demedikçe bu kapıyı atlama.
- İç kapı: oda 90, banyo/WC 80 cm. Komşuluk grafiğindeki her bağ bir kapıdır; kapısız (erişilemez) oda YOK — her oda dış giriş kapısından bir kapı zinciriyle ulaşılabilir olsun.
- kind:"window" YALNIZ dış (çevre) duvarda; iç bölme duvarına pencere koyma. Genişlik: salon 150-260, yatak/mutfak 100-150, banyo 60-80. Pencere ile kapı arası ≥60 cm.

[ERİŞİLEBİLİRLİK] TS 9111 ruhuna uygun: kapı net geçişi ≥80 cm; mümkünse antre/banyoda ~150 cm serbest dönüş alanı bırak (hedef, katı zorunluluk değil).

[ODA ADLARI & TYPE] Türkçe, standart adlar: Salon, Mutfak, Antre, Hol, Koridor, Ebeveyn Yatak Odası, Yatak Odası, Çocuk Odası, Çalışma Odası, Banyo, WC, Balkon, Depo. type alanı YALNIZ şu sekiz değerden biri olmalı (başka değer — örn "bedroom", "wc", "hall", "balcony" — uygulama tarafından REDDEDİLİR): living | kitchen | bathroom | wet | sleeping | circulation | service | other. Eşleme: salon=living; mutfak=kitchen; her tür yatak/çocuk/ebeveyn odası=sleeping; banyo ve WC=bathroom (yoğun ıslak alan=wet); antre/hol/koridor=circulation; balkon/depo=service; çalışma vb.=other.

[VARSAYIM] 2+1 ve üzeri planda ebeveyn ensuite + ortak banyo ayrımını düşün; 3+1 ve üzeri planda ayrı WC ekle. Kabuk uygunsa salon ya da mutfaktan açılan bir balkon ekle.

[SUMMARY] Türkçe, ≤280 karakter: plan tipi (ör. 2+1), yaklaşık toplam net m², oda dağılımı + yaptığın varsayım/yön/parti. Bu DÜZENLENEBİLİR bir başlangıç taslağıdır; kara kutu değil.

[VARYANT — gerçekten farklı olsun] Birden çok varyant istenirse her birine ÜRETMEDEN ÖNCE farklı bir "parti" (strateji) ata; iki varyant aynı stratejiyi paylaşamaz. Şu eksenlerden en az birinde gerçekten ayrış: (a) açık/Amerikan ↔ kapalı mutfak, (b) merkezi hol-hub ↔ koridor-eksenli sirkülasyon, (c) ebeveyn banyolu (ensuite) ↔ ortak banyo, (d) kompakt kare ↔ uzun lineer/L kütle. TÜM varyantlar AYNI programı ve TR normlarını korur; fark yalnız yerleşimde olsun (oda ekleyip çıkararak değil). Aynı komşuluk grafiği + benzer kabuk = sahte çeşitlilik, üretme.

[ÖZ-DENETİM — JSON'u yazmadan önce içsel doğrula, sonra yaz] (1) dış kabuk kapalı döngü mü; (2) her iç duvar ucu bir duvara/köşeye birebir değiyor mu; (3) paylaşılan duvarlar tek segment mi; (4) odalar çakışmıyor mu; (5) her oda kapıyla erişilebilir mi; (6) her opening bir duvar üzerinde, pencereler dış duvarda mı; (7) en az 1 dış giriş kapısı var mı; (8) tüm sayılar tam sayı cm ve sınırlar içinde, type değerleri yukarıdaki sekizliden mi. Tutmayan maddeyi düzelt; tek sayıyı kopyalayıp dejenere duvar üretme. Bu adımların hiçbiri çıktıya yansımaz; yansırsa yanıt geçersizdir.

[ÖRNEK — doğru YAPIYI öğretir (kapalı köşeler, paylaşılan tek-segment ızgara çizgileri, mutfak-banyo bitişik ıslak çekirdek, hole açılan dış kapı, dış duvarda pencereler). KOPYALAMA; kullanıcının tarifine göre oda sayısını ve ölçüleri yeniden kur.]
<ornek>
{"summary":"2+1 (~72 m²): güneybatıda salon, kuzeybatıda mutfak; mutfak ile banyo bitişik ıslak çekirdek; orta holden doğu cephede 2 yatak odası. Giriş güneyden hole; salon güney+batı pencereli. Düzenlenebilir başlangıç taslağı.","walls":[[0,0,900,0],[900,0,900,800],[900,800,0,800],[0,800,0,0],[450,0,450,800],[600,0,600,800],[0,300,450,300],[450,260,600,260],[600,400,900,400]],"rooms":[{"name":"Salon","type":"living","cx":225,"cy":550},{"name":"Mutfak","type":"kitchen","cx":225,"cy":150},{"name":"Banyo","type":"bathroom","cx":525,"cy":130},{"name":"Hol","type":"circulation","cx":525,"cy":530},{"name":"Ebeveyn Yatak Odası","type":"sleeping","cx":750,"cy":200},{"name":"Çocuk Odası","type":"sleeping","cx":750,"cy":600}],"openings":[{"kind":"door","cx":525,"cy":800,"width":100},{"kind":"door","cx":450,"cy":550,"width":90},{"kind":"door","cx":525,"cy":260,"width":80},{"kind":"door","cx":600,"cy":330,"width":90},{"kind":"door","cx":600,"cy":600,"width":90},{"kind":"door","cx":200,"cy":300,"width":90},{"kind":"window","cx":200,"cy":800,"width":180},{"kind":"window","cx":0,"cy":550,"width":150},{"kind":"window","cx":0,"cy":150,"width":120},{"kind":"window","cx":900,"cy":200,"width":150},{"kind":"window","cx":900,"cy":600,"width":150}]}
</ornek>`;

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
  const userContent = `${baseContent}\n\nÖNEMLİ: ${count} GERÇEKTEN FARKLI plan üret; her birine ayrı bir tasarım stratejisi (parti) ata (ör. açık/Amerikan mutfak ↔ kapalı mutfak, merkezi hol-hub ↔ koridor-eksenli sirkülasyon, kompakt kare ↔ uzun/L kütle). Hepsi AYNI oda programını ve TR normlarını korusun — fark yalnız yerleşimde olsun, oda ekleyip çıkararak değil. walls≤600 / rooms≤300 sınırı plan BAŞINADIR. Yanıtı {"variants":[plan1, plan2]} biçiminde döndür; her plan şemaya tek başına uysun.`;

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
