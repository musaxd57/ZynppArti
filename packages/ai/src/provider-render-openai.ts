import { renderImage, OPENAI_IMAGE_MODEL } from './render';
import type { RenderProvider } from './render-types';

/**
 * "Yaratıcı" mod sağlayıcısı: mevcut renderImage()'i (OpenAI text→image) RenderProvider arkasına sarar.
 * supportsControl=false → kontrol görseli yok sayılır (geometri serbest). DAVRANIŞ DEĞİŞMEZ.
 */
export function openaiRenderProvider(apiKey: string, model?: string): RenderProvider {
  return {
    name: 'openai',
    supportsControl: false,
    async generate(input, signal) {
      const image = await renderImage(apiKey, input.prompt, model, signal);
      return { image, provider: 'openai', model: model ?? OPENAI_IMAGE_MODEL };
    },
  };
}
