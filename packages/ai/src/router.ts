import type { AiProviderName, Tier } from './types';

/**
 * Görev zorluğuna göre sağlayıcı yönlendirme (ADR-0042). Politika **HIZ-ÖNCELİKLİ** (bkz. FALLBACK_CHAINS
 * + satır 86-91): **basit/orta → OpenAI** önce (~1.3sn), **karmaşık/yönetmelik → Claude (Anthropic)** önce
 * (~2.7sn); **Akash her kademede yalnız SON yedek**. Heuristik + fallback; mükemmel sınıflandırma şart
 * değil (yanlışta zincir bir sonraki sağlayıcıya düşer).
 */

/**
 * Türkçe metni ŞAPKA-DUYARSIZ ASCII'ye indirger (ç→c, ş→s, ğ→g, ı→i, ö→o, ü→u, İ→i) + küçük harf.
 * Kritik: kullanıcılar çoğu zaman şapkasız yazar ("yonetmelik", "nasil") → anahtar kelimeler ASCII
 * tutulur ve soru da ASCII'ye katlanır, böylece her iki yazım da eşleşir.
 */
function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u');
}

/**
 * Karmaşık (Claude) sinyalleri — ASCII-katlanmış (şapkasız). Üç küme: yönetmelik/mevzuat,
 * yapı/can-güvenliği, akıl-yürütme/öneri + yükümlülük ("olmalı/gerekir/minimum") soruları.
 */
const COMPLEX_KEYWORDS = [
  // Yönetmelik / mevzuat
  'yonetmelik', 'imar', 'tbdy', 'otopark', 'ts 9111', 'ts9111', 'ts 12576', 'mevzuat',
  'cekme', 'setback', 'taks', 'kaks', 'emsal', 'gabari', 'parsel', 'ruhsat', 'iskan',
  'erisilebilir', 'engelli', 'rampa', 'plan notu',
  // Yapı / can güvenliği (akıl + sorumluluk)
  'deprem', 'statik', 'tasiyici', 'kolon', 'kiris', 'perde', 'temel', 'yangin', 'tahliye',
  'kacis', 'merdiven', 'yalitim', 'akustik', 'enerji kimlik',
  // Akıl-yürütme / öneri / yükümlülük
  'neden', 'nicin', 'karsilastir', 'kiyasla', 'analiz', 'degerlendir', 'oner', 'tasarla',
  'optimize', 'iyilestir', 'uygun mu', 'dogru mu', 'riskli', 'hesapla', 'yorumla', 'acikla',
  'minimum', 'maksimum', 'en az', 'en fazla', 'olmali', 'gerekir', 'sart', 'zorunlu',
  'ideal', 'standart', 'daha iyi', 'nasil olmali',
];

/** Dar "orta" (OpenAI) ipuçları — ASCII-katlanmış. yönetmelik değil ama biraz akıl isteyen. */
const MEDIUM_HINTS = ['nasil', 'farki', 'avantaj', 'dezavantaj', 'hangisi', 'ozetle', 'fikir', 'yorum'];

/**
 * Bir sorunun zorluk kademesini belirler. Varsayılan = simple (Akash) → Akash-ağırlıklı.
 * complex: yönetmelik/yapı/akıl-yürütme anahtarı VEYA çok uzun (>240). medium: dar bant.
 */
export function classifyTier(question: string): Tier {
  const q = normalizeTr(question);
  if (COMPLEX_KEYWORDS.some((k) => q.includes(k)) || question.length > 240) return 'complex';
  // Orta: dar bant — orta-uzun soru ya da bir "orta" ipucu (yönetmelik değil).
  if (question.length >= 150 && question.length <= 240) return 'medium';
  if (question.length >= 80 && MEDIUM_HINTS.some((k) => q.includes(k))) return 'medium';
  return 'simple';
}

/** Kademeye göre yanıt üst sınırı (token). Basit soru → az token → HIZLI + ucuz. */
export function maxTokensForTier(tier: Tier): number {
  return tier === 'simple' ? 700 : tier === 'medium' ? 1400 : 3000;
}

/**
 * Tasarım (Çiz) zorluğu (Moses talebi): **gelişmiş tasarımlar Claude'la başlasın**, **Akash'ın
 * rahatça halledebileceği basit daireler hemen Akash'a** gitsin (ucuz). Sınıflandırma yanlışsa
 * fallback korur: Akash geçersiz JSON üretirse zincir sıradakine (Claude) düşer.
 *
 * complex (Claude-önce): villa/dubleks, çok katlı, ofis/klinik/otel, parsel/çekme/yönetmelik
 * kısıtı, kalabalık program (≥4 oda tipi sinyali), uzun/detaylı tarif. Aksi halde simple (Akash-önce).
 */
const DESIGN_ADVANCED = [
  'villa', 'dubleks', 'tripleks', 'cati kati', 'cati arasi', 'cok katli', 'kat plani',
  'ofis', 'klinik', 'otel', 'magaza', 'kompleks', 'detayli', 'karmasik', 'kompleks',
  'komsuluk', 'program', 'engelli', 'erisilebilir', 'yonetmelik', 'cekme', 'parsel',
  'setback', 'imar', '4+1', '5+1', '6+1', 'cok odali',
];

export function classifyDesignTier(prompt: string): Tier {
  const q = normalizeTr(prompt);
  if (DESIGN_ADVANCED.some((k) => q.includes(k)) || prompt.length > 160) return 'complex';
  return 'simple';
}

/**
 * Her kademe için sağlayıcı denenme sırası (ilk = birincil, sonrası fallback). **HIZ ÖNCELİKLİ**
 * (Moses kararı + ölçüm: OpenAI ~1.3sn, Claude ~2.7sn, Akash GLM-5.2 ~8sn — reasoning modeli yavaş).
 * Basit/orta → OpenAI (en hızlı); karmaşık/yönetmelik → Claude (kalite, atıf); **Akash yalnız son
 * yedek** (ucuz ama yavaş; ancak ikisi de düşerse devreye girer).
 */
export const FALLBACK_CHAINS: Record<Tier, readonly AiProviderName[]> = {
  simple: ['openai', 'anthropic', 'akash'],
  medium: ['openai', 'anthropic', 'akash'],
  complex: ['anthropic', 'openai', 'akash'],
};

/**
 * Kademe + (varsa) zorunlu sağlayıcı + mevcut sağlayıcılar → denenecek sıralı sağlayıcı listesi.
 * Zorunlu sağlayıcı (AI_PROVIDER) en başa alınır; anahtarı olmayanlar elenir.
 */
export function resolveChain(
  tier: Tier,
  available: readonly AiProviderName[],
  forced?: AiProviderName,
): AiProviderName[] {
  const base = forced
    ? [forced, ...FALLBACK_CHAINS[tier].filter((p) => p !== forced)]
    : [...FALLBACK_CHAINS[tier]];
  return base.filter((p) => available.includes(p));
}
