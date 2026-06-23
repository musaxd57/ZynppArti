import type { AiProviderName, Tier } from './types';

/**
 * Görev zorluğuna göre sağlayıcı yönlendirme (ADR-0042). Tasarım hedefi (Moses): **çoğu trafik
 * Akash** (ucuz açık model), **OpenAI nadir** (yalnız dar "orta" bant), **yönetmelik/akıl yürütme
 * Claude**. Heuristik + fallback; mükemmel sınıflandırma şart değil (yanlışta fallback devreye girer).
 */

/** Karmaşık (Claude) sinyalleri: yönetmelik + akıl-yürütme fiilleri. Türkçe küçük harf (tr locale). */
const COMPLEX_KEYWORDS = [
  'yönetmelik', 'imar', 'tbdy', 'deprem', 'otopark', 'ts 9111', 'ts9111', 'çekme', 'setback',
  'taks', 'kaks', 'emsal', 'mevzuat', 'erişilebilir', 'engelli', 'yangın', 'tahliye',
  'neden', 'niçin', 'karşılaştır', 'kıyasla', 'analiz', 'değerlendir', 'öner', 'tasarla',
  'optimize', 'iyileştir', 'uygun mu', 'riskli', 'hesapla', 'yorumla', 'açıkla',
];

/** Dar "orta" (OpenAI) ipuçları — yönetmelik değil ama biraz akıl isteyen. */
const MEDIUM_HINTS = ['nasıl', 'farkı', 'avantaj', 'dezavantaj', 'hangisi daha', 'özetle'];

/** Bir sorunun zorluk kademesini belirler. Varsayılan = simple (Akash) → Akash-ağırlıklı. */
export function classifyTier(question: string): Tier {
  const q = question.toLocaleLowerCase('tr');
  if (COMPLEX_KEYWORDS.some((k) => q.includes(k)) || question.length > 280) return 'complex';
  // Orta: dar bant — orta-uzun soru ya da bir "orta" ipucu (yönetmelik değil).
  if (question.length >= 160 && question.length <= 280) return 'medium';
  if (question.length >= 90 && MEDIUM_HINTS.some((k) => q.includes(k))) return 'medium';
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
