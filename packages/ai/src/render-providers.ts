import { openaiRenderProvider } from './provider-render-openai';
import { replicateRenderProvider } from './provider-render-replicate';
import type { RenderMode, RenderProvider, RenderProviderName } from './render-types';

/**
 * Render sağlayıcı kurulumu + yönlendirme (providers.ts / router.ts deseninin render karşılığı).
 * ENV-GATED: anahtarı olmayan sağlayıcı KURULMAZ → 'preserve' modunda anahtar yoksa zincir BOŞ döner →
 * çağıran 503 verir, hiç ağ çağrısı / para harcanmaz (Paddle-webhook env-gate disipliniyle aynı).
 */
export interface RenderEnv {
  readonly OPENAI_API_KEY?: string;
  readonly OPENAI_IMAGE_MODEL?: string;
  readonly REPLICATE_API_TOKEN?: string;
  readonly REPLICATE_PRESERVE_VERSION?: string;
  readonly RENDER_PRESERVE_HD_MODEL?: string;
  readonly FAL_KEY?: string;
  readonly RENDER_PRESERVE_PROVIDER?: string;
}

export function buildRenderProviders(env: RenderEnv): Partial<Record<RenderProviderName, RenderProvider>> {
  const out: Partial<Record<RenderProviderName, RenderProvider>> = {};
  if (env.OPENAI_API_KEY?.trim()) {
    out.openai = openaiRenderProvider(env.OPENAI_API_KEY.trim(), env.OPENAI_IMAGE_MODEL?.trim() || undefined);
  }
  if (env.REPLICATE_API_TOKEN?.trim()) {
    out.replicate = replicateRenderProvider(env.REPLICATE_API_TOKEN.trim(), {
      interiorVersion: env.REPLICATE_PRESERVE_VERSION?.trim() || undefined,
      hdModel: env.RENDER_PRESERVE_HD_MODEL?.trim() || undefined,
    });
  }
  // Fal ikinci adapter (FAL_KEY) — aynı arayüz, anahtarsız uyur (gelecek; ayrı ADR):
  // if (env.FAL_KEY?.trim()) out.fal = falRenderProvider(env.FAL_KEY.trim());
  return out;
}

export function parseForcedRenderProvider(v?: string): RenderProviderName | undefined {
  const x = v?.trim().toLowerCase();
  return x === 'replicate' || x === 'fal' || x === 'openai' ? x : undefined;
}

/**
 * Mod + mevcut sağlayıcılar → denenecek sıralı liste. creative → [openai]; preserve → [replicate, fal].
 * forced varsa başa alınır. Anahtarı olmayan elenir → boş liste = yapılandırılmamış (503).
 */
export function resolveRenderChain(
  mode: RenderMode,
  available: readonly RenderProviderName[],
  forced?: RenderProviderName,
): RenderProviderName[] {
  const base: RenderProviderName[] = mode === 'creative' ? ['openai'] : ['replicate', 'fal'];
  // forced (RENDER_PRESERVE_PROVIDER) YALNIZ preserve sağlayıcı seçimini etkiler — creative daima openai
  // (aksi halde force env'i creative'i yanlışlıkla replicate'e zorlar = bozulma).
  const chain = mode === 'preserve' && forced ? [forced, ...base.filter((p) => p !== forced)] : base;
  return chain.filter((p) => available.includes(p));
}
