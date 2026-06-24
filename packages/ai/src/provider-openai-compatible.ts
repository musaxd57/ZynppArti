import OpenAI from 'openai';
import type { AiProvider, AiProviderName, ChatMessage, ChatOptions } from './types';

/**
 * OpenAI-uyumlu sağlayıcı fabrikası — hem OpenAI'ı hem AkashML'i (aynı `openai` SDK, farklı `baseURL`)
 * tek koddan üretir. AkashML OpenAI-uyumlu uçtur (`https://api.akashml.com/v1`, Bearer token).
 *
 * Token alanı sağlayıcıya göre değişir: OpenAI yeni modeller `max_completion_tokens` ister (reasoning
 * modelleri `max_tokens`'ı reddeder); AkashML klasik `max_tokens` kullanır. `temperature` yalnız
 * destekleyen sağlayıcıda gönderilir (bazı OpenAI reasoning modelleri özel temperature'ı reddeder).
 */
export interface OpenAICompatConfig {
  readonly name: AiProviderName;
  readonly apiKey: string;
  readonly model: string;
  /** OpenAI için boş; AkashML için `https://api.akashml.com/v1`. */
  readonly baseURL?: string;
  readonly tokenParam: 'max_tokens' | 'max_completion_tokens';
  /** Verilirse istek temperature'ı (yoksa model varsayılanı). */
  readonly temperature?: number;
}

export function openAICompatibleProvider(cfg: OpenAICompatConfig): AiProvider {
  const client = new OpenAI({ apiKey: cfg.apiKey, ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}) });
  return {
    name: cfg.name,
    model: cfg.model,
    async chat(messages: readonly ChatMessage[], opts: ChatOptions): Promise<string> {
      const max = opts.maxTokens ?? 2000;
      const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
        model: cfg.model,
        messages: [
          ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      };
      if (cfg.tokenParam === 'max_completion_tokens') params.max_completion_tokens = max;
      else params.max_tokens = max;
      if (cfg.temperature !== undefined) params.temperature = cfg.temperature;

      const res = await client.chat.completions.create(
        params,
        opts.signal ? { signal: opts.signal } : undefined,
      );
      return (res.choices[0]?.message?.content ?? '').trim() || 'Yanıt üretilemedi (boş döndü).';
    },

    async chatStream(messages, opts, onDelta): Promise<string> {
      const max = opts.maxTokens ?? 2000;
      const base: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
        model: cfg.model,
        stream: true,
        messages: [
          ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      };
      if (cfg.tokenParam === 'max_completion_tokens') base.max_completion_tokens = max;
      else base.max_tokens = max;
      if (cfg.temperature !== undefined) base.temperature = cfg.temperature;

      const stream = await client.chat.completions.create(
        base,
        opts.signal ? { signal: opts.signal } : undefined,
      );
      let full = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      }
      return full.trim() || 'Yanıt üretilemedi (boş döndü).';
    },
  };
}
