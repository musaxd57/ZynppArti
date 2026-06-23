import { openAICompatibleProvider } from './provider-openai-compatible';
import type { AiProvider } from './types';

/** OpenAI orta-kademe modeli (router'da nadir seçilir). `.env` OPENAI_MODEL ile değiştirilebilir. */
export const OPENAI_DEFAULT_MODEL = 'gpt-5.4';

/**
 * OpenAI sağlayıcısı — resmî `openai` SDK. `max_completion_tokens` kullanır (yeni/akıl-yürütme
 * modelleriyle uyumlu); özel temperature gönderilmez (bazı reasoning modelleri reddeder).
 */
export function openaiProvider(apiKey: string, model: string = OPENAI_DEFAULT_MODEL): AiProvider {
  return openAICompatibleProvider({
    name: 'openai',
    apiKey,
    model,
    tokenParam: 'max_completion_tokens',
  });
}
