import { anthropicProvider } from './provider-anthropic';
import { openaiProvider } from './provider-openai';
import { akashProvider } from './provider-akash';
import type { AiProvider, AiProviderName } from './types';

/** Sağlayıcı seçimi için okunan env (Next.js sunucu route'u `process.env`'den doldurur). */
export interface ProviderEnv {
  /** Zorunlu sağlayıcı (opsiyonel): anthropic | openai | akash. Boşsa zorluk-bazlı router. */
  readonly AI_PROVIDER?: string;
  readonly ANTHROPIC_API_KEY?: string;
  readonly OPENAI_API_KEY?: string;
  readonly AKASHML_API_KEY?: string;
  readonly ANTHROPIC_MODEL?: string;
  readonly OPENAI_MODEL?: string;
  readonly AKASHML_MODEL?: string;
}

/**
 * Env'deki anahtarlara göre KULLANILABİLİR sağlayıcıları kurar (anahtarı olmayan atlanır). Router
 * yalnız bunlar arasından seçer/fallback yapar → eksik anahtar hata değil, zincirden eleme.
 */
export function buildProviders(env: ProviderEnv): Partial<Record<AiProviderName, AiProvider>> {
  const out: Partial<Record<AiProviderName, AiProvider>> = {};
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  const openaiKey = env.OPENAI_API_KEY?.trim();
  const akashKey = env.AKASHML_API_KEY?.trim();
  if (anthropicKey) out.anthropic = anthropicProvider(anthropicKey, env.ANTHROPIC_MODEL);
  if (openaiKey) out.openai = openaiProvider(openaiKey, env.OPENAI_MODEL);
  if (akashKey) out.akash = akashProvider(akashKey, env.AKASHML_MODEL);
  return out;
}

/** `AI_PROVIDER` değerini geçerli bir sağlayıcı adına çevirir (yoksa undefined → router serbest). */
export function parseForcedProvider(value: string | undefined): AiProviderName | undefined {
  const v = value?.trim().toLowerCase();
  return v === 'anthropic' || v === 'openai' || v === 'akash' ? v : undefined;
}
