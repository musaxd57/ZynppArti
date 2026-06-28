import { buildSystemPrompt } from './prompt';
import { classifyTier, resolveChain, maxTokensForTier } from './router';
import { tierTimeoutMs, withTimeout, withIdleTimeout } from './timeout';
import type { AiProvider, AiProviderName, ChatMessage, CopilotContext, Tier } from './types';

export interface CopilotResult {
  readonly answer: string;
  /** Yanıtı üreten sağlayıcı (fallback sonrası gerçek). */
  readonly provider: AiProviderName;
  readonly model: string;
  /** Sınıflandırılan zorluk kademesi (teşhis/şeffaflık). */
  readonly tier: Tier;
}

/** Hiç sağlayıcı (anahtar) yapılandırılmadığında. Route bunu 503'e çevirir. */
export class NoProviderError extends Error {
  constructor() {
    super('Hiç AI sağlayıcısı yapılandırılmadı (anahtar yok).');
    this.name = 'NoProviderError';
  }
}

/**
 * Doğal-dil copilot çağrısı (Fikir 1) — zorluk-bazlı yönlendirme + fallback (ADR-0042).
 * Son kullanıcı mesajının zorluğuna göre sağlayıcı sırası belirlenir; biri çökerse/anahtarı yoksa
 * sıradaki denenir. Salt-okunur (Seviye 1): modeli değiştirmez.
 */
export async function askCopilot(
  providers: Partial<Record<AiProviderName, AiProvider>>,
  messages: readonly ChatMessage[],
  ctx: CopilotContext,
  forced?: AiProviderName,
  signal?: AbortSignal,
): Promise<CopilotResult> {
  const available = Object.keys(providers) as AiProviderName[];
  if (available.length === 0) throw new NoProviderError();

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const tier = classifyTier(lastUser?.content ?? '');
  const chain = resolveChain(tier, available, forced);
  // Zincir boşsa (forced sağlayıcının anahtarı yok gibi) → mevcut herhangi biriyle dene.
  const order = chain.length > 0 ? chain : available;

  const system = buildSystemPrompt(ctx);
  const maxTokens = maxTokensForTier(tier);
  let lastErr: unknown;
  for (const name of order) {
    const provider = providers[name];
    if (!provider) continue;
    // Maliyet koruması: her deneme zaman aşımlı + parent signal (istemci kopunca upstream'i iptal et →
    // boşa paralı token harcamasın; askCopilotStream ile tutarlı — denetim L11).
    const { signal: attemptSignal, dispose } = withTimeout(tierTimeoutMs(tier), signal);
    try {
      const answer = await provider.chat(messages, { system, maxTokens, signal: attemptSignal });
      // Boş/yalnız-boşluk yanıt = başarısızlık say → sıradaki sağlayıcıya düş (boş baloncuk gösterme).
      if (answer.trim().length === 0) {
        lastErr = new Error(`Sağlayıcı "${name}" boş yanıt döndürdü.`);
        console.error(`Copilot sağlayıcı "${name}" boş yanıt verdi, fallback deneniyor.`);
        continue;
      }
      return { answer, provider: name, model: provider.model, tier };
    } catch (e) {
      lastErr = e;
      console.error(`Copilot sağlayıcı "${name}" başarısız, fallback deneniyor:`, e);
    } finally {
      dispose();
    }
  }
  throw lastErr ?? new Error('Tüm AI sağlayıcıları başarısız oldu.');
}

/**
 * Akışlı copilot — yanıtı `onDelta` ile parça parça yayar. Fallback yalnız **akış başlamadan** çalışır
 * (ilk parça gelmeden hata olursa sıradaki sağlayıcıya geçer); akış başladıysa o sağlayıcıya bağlı kalır.
 */
export async function askCopilotStream(
  providers: Partial<Record<AiProviderName, AiProvider>>,
  messages: readonly ChatMessage[],
  ctx: CopilotContext,
  onDelta: (delta: string) => void,
  forced?: AiProviderName,
  signal?: AbortSignal,
): Promise<void> {
  const available = Object.keys(providers) as AiProviderName[];
  if (available.length === 0) throw new NoProviderError();

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const tier = classifyTier(lastUser?.content ?? '');
  const chain = resolveChain(tier, available, forced);
  const order = chain.length > 0 ? chain : available;

  const system = buildSystemPrompt(ctx);
  const maxTokens = maxTokensForTier(tier);
  let lastErr: unknown;
  for (const name of order) {
    const provider = providers[name];
    if (!provider) continue;
    let started = false;
    // İstemci iptali (parent) + BOŞTA-KALMA timeout'u: token aktıkça `bump()` pencereyi sıfırlar →
    // sağlıklı ama uzun yanıt kesilmez; yalnız askıda upstream iptal olur (mutlak deadline yerine).
    const { signal: attemptSignal, bump, dispose } = withIdleTimeout(tierTimeoutMs(tier), signal);
    try {
      // onDelta yalnız boş-OLMAYAN parçayla çağrılır (sağlayıcılar boş delta'yı eler) → `started`
      // yalnız gerçek içerik gelince true olur; akış başladıysa fallback yapılmaz (aşağıda).
      await provider.chatStream(messages, { system, maxTokens, signal: attemptSignal }, (d) => {
        bump(); // her delta idle penceresini sıfırlar
        started = true;
        onDelta(d);
      });
      // Akış hatasız bitti ama tek bir parça bile gelmediyse = boş yanıt → sıradakine düş.
      if (!started) {
        lastErr = new Error(`Sağlayıcı "${name}" boş akış döndürdü.`);
        console.error(`Copilot stream sağlayıcı "${name}" boş akış verdi, fallback deneniyor.`);
        continue;
      }
      return;
    } catch (e) {
      lastErr = e;
      console.error(`Copilot stream sağlayıcı "${name}" başarısız:`, e);
      if (started) throw e; // akış başladıysa fallback yapma (kısmi yanıt karışmasın)
    } finally {
      dispose();
    }
  }
  throw lastErr ?? new Error('Tüm AI sağlayıcıları başarısız oldu.');
}
