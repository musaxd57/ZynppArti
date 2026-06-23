import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, ChatMessage, ChatOptions } from './types';

/** AI uçlarında en güncel/yetenekli Claude modeli (CLAUDE.md §5 model notu). */
export const ANTHROPIC_DEFAULT_MODEL = 'claude-opus-4-8';

/**
 * Anthropic (Claude) sağlayıcısı — resmî `@anthropic-ai/sdk`. Adaptive thinking açık (önerilen),
 * interaktif copilot için `effort: 'low'`. NOT: thinking token'ları `max_tokens`'a sayılır → yanıt
 * kırpılmasın diye geniş bütçe (vars. 6000). `temperature` GÖNDERİLMEZ (Opus 4.8 reddeder, 400).
 * Refusal (güvenlik reddi) açıkça ele alınır; boş yanıt yerine anlamlı mesaj döner.
 */
export function anthropicProvider(apiKey: string, model: string = ANTHROPIC_DEFAULT_MODEL): AiProvider {
  const client = new Anthropic({ apiKey });
  return {
    name: 'anthropic',
    model,
    async chat(messages: readonly ChatMessage[], opts: ChatOptions): Promise<string> {
      const res = await client.messages.create({
        model,
        max_tokens: opts.maxTokens ?? 6000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low' },
        ...(opts.system ? { system: opts.system } : {}),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      if (res.stop_reason === 'refusal') {
        return 'Bu soruya güvenlik nedeniyle yanıt veremiyorum.';
      }
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();
      // Yanıt max_tokens'a takılıp boş kaldıysa (thinking tüm bütçeyi yediyse) bilgilendir.
      if (!text) {
        return res.stop_reason === 'max_tokens'
          ? 'Yanıt çok uzun oldu ve kesildi; lütfen soruyu daraltın.'
          : 'Yanıt üretilemedi (boş döndü).';
      }
      return text;
    },
  };
}
