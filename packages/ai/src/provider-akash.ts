import { openAICompatibleProvider } from './provider-openai-compatible';
import type { AiProvider } from './types';

/** AkashML OpenAI-uyumlu uç (decentralized supercloud, açık modeller — ucuz). */
export const AKASH_BASE_URL = 'https://api.akashml.com/v1';

/**
 * AkashML varsayılan modeli — GLM 5.2 (753B, uzun-ufuk agentic; güçlü + ucuz, iyi Türkçe).
 * `.env` AKASHML_MODEL ile değiştirilebilir (ör. deepseek-ai/DeepSeek-V3.2, Qwen3…). Tam ID'yi
 * AkashML panelinden kopyalayabilirsin.
 */
export const AKASH_DEFAULT_MODEL = 'zai-org/GLM-5.2';

/**
 * AkashML sağlayıcısı — `openai` SDK + AkashML baseURL. Klasik `max_tokens` + temperature kullanır
 * (AkashML/GLM destekler). Router'da çoğu trafiğin (basit + fallback) varsayılan hedefi.
 */
export function akashProvider(apiKey: string, model: string = AKASH_DEFAULT_MODEL): AiProvider {
  return openAICompatibleProvider({
    name: 'akash',
    apiKey,
    baseURL: AKASH_BASE_URL,
    model,
    tokenParam: 'max_tokens',
    temperature: 0.3,
  });
}
