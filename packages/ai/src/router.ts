import type { AiProviderName, Tier } from './types';

/**
 * Görev zorluğuna göre sağlayıcı yönlendirme (ADR-0042). Tasarım hedefi (Moses): **çoğu trafik
 * Akash** (ucuz açık model), **OpenAI nadir** (yalnız dar "orta" bant), **yönetmelik/akıl yürütme
 * Claude**. Heuristik + fallback; mükemmel sınıflandırma şart değil (yanlışta fallback devreye girer).
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

/** Karmaşık (Claude) sinyalleri — ASCII-katlanmış (şapkasız). yönetmelik + akıl-yürütme fiilleri. */
const COMPLEX_KEYWORDS = [
  'yonetmelik', 'imar', 'tbdy', 'deprem', 'otopark', 'ts 9111', 'ts9111', 'cekme', 'setback',
  'taks', 'kaks', 'emsal', 'mevzuat', 'erisilebilir', 'engelli', 'yangin', 'tahliye',
  'neden', 'nicin', 'karsilastir', 'kiyasla', 'analiz', 'degerlendir', 'oner', 'tasarla',
  'optimize', 'iyilestir', 'uygun mu', 'riskli', 'hesapla', 'yorumla', 'acikla',
];

/** Dar "orta" (OpenAI) ipuçları — ASCII-katlanmış. yönetmelik değil ama biraz akıl isteyen. */
const MEDIUM_HINTS = ['nasil', 'farki', 'avantaj', 'dezavantaj', 'hangisi daha', 'ozetle'];

/** Bir sorunun zorluk kademesini belirler. Varsayılan = simple (Akash) → Akash-ağırlıklı. */
export function classifyTier(question: string): Tier {
  const q = normalizeTr(question);
  if (COMPLEX_KEYWORDS.some((k) => q.includes(k)) || question.length > 280) return 'complex';
  // Orta: dar bant — orta-uzun soru ya da bir "orta" ipucu (yönetmelik değil).
  if (question.length >= 160 && question.length <= 280) return 'medium';
  if (question.length >= 90 && MEDIUM_HINTS.some((k) => q.includes(k))) return 'medium';
  return 'simple';
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
 * Her kademe için sağlayıcı denenme sırası (ilk = birincil, sonrası fallback). OpenAI 3 zincirin
 * 2'sinde sonda → fallback'te bile az kullanılır (Moses: "OpenAI çok seçilmesin").
 */
export const FALLBACK_CHAINS: Record<Tier, readonly AiProviderName[]> = {
  simple: ['akash', 'anthropic', 'openai'],
  medium: ['openai', 'akash', 'anthropic'],
  complex: ['anthropic', 'akash', 'openai'],
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
