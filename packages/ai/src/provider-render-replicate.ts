import { RENDER_PRESERVE_DEADLINE_MS } from './render';
import { withTimeout } from './timeout';
import type { RenderInput, RenderProvider, RenderResult } from './render-types';

/**
 * "Geometriyi koru" (ControlNet) render sağlayıcısı — Replicate REST'e HAM fetch (yeni SDK bağımlılığı YOK).
 * Yalnız SUNUCU tarafı (token gizli). Senkron submit + poll (Prefer:wait), Hobby 60s tavanının ALTINDA bir
 * deadline; deadline/iptalde best-effort cancel. Çıktı sunucuda data-url'e rehost edilir (gizlilik +
 * 1 saatlik URL süresi sorununu çözer).
 *
 * İKİ MODEL AİLESİ — şemaları FARKLI, payload buna göre kurulur:
 *  • RESMİ FLUX (önerilen, varsayılan): black-forest-labs/flux-canny-dev | flux-depth-dev. Endpoint
 *    /v1/models/{slug}/predictions (sürüm hash GEREKMEZ). Şema: { prompt, control_image, guidance,
 *    output_format, megapixels }. conditioning_scale/prompt_strength YOK → sadakat `guidance` ile.
 *  • COMMUNITY SDXL (ör. adirik/interior-design): /v1/predictions + version hash (ZORUNLU). Şema:
 *    { image, prompt, negative_prompt, conditioning_scale, prompt_strength, num_inference_steps, ... }.
 */

const API = 'https://api.replicate.com/v1';

async function rehost(url: string, signal: AbortSignal): Promise<string> {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`Render çıktısı indirilemedi (${r.status}).`);
  const buf = Buffer.from(await r.arrayBuffer());
  const mime = r.headers.get('content-type') ?? 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

interface Prediction {
  id: string;
  status: string;
  output?: unknown;
  error?: unknown;
  urls?: { get?: string };
}

export interface ReplicateRenderOpts {
  /** Resmi model slug'ı (ör. black-forest-labs/flux-canny-dev) — VARSAYILAN preserve modeli (sürüm istemez). */
  readonly model?: string;
  /** Community model sürüm hash'i (model verilmezse kullanılır; /v1/predictions + version). */
  readonly version?: string;
  /** Açık HD kademesi için resmi model slug'ı (input.hd=true). */
  readonly hdModel?: string;
}

/** 0.55/0.75/0.9 (SDXL ölçeği) → FLUX guidance (~20-45; varsayılan 30). Yüksek sadakat = yüksek guidance. */
function fluxGuidance(conditioningScale?: number): number {
  const c = typeof conditioningScale === 'number' ? conditioningScale : 0.75;
  return Math.round(Math.min(50, Math.max(15, c * 50)));
}

export function replicateRenderProvider(token: string, opts?: ReplicateRenderOpts): RenderProvider {
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  return {
    name: 'replicate',
    supportsControl: true,
    async generate(input: RenderInput, parent?: AbortSignal): Promise<RenderResult> {
      const t = withTimeout(RENDER_PRESERVE_DEADLINE_MS, parent);
      let predId: string | undefined;
      try {
        // Model seçimi: HD (açıkça istenen) → hdModel; aksi halde resmi `model`; o da yoksa community `version`.
        const officialSlug = input.hd && opts?.hdModel ? opts.hdModel : opts?.model;
        const endpoint = officialSlug ? `${API}/models/${officialSlug}/predictions` : `${API}/predictions`;

        let modelInput: Record<string, unknown>;
        if (officialSlug) {
          // RESMİ FLUX şeması (flux-canny-dev / flux-depth-dev). control_image data-URI kabul eder.
          modelInput = {
            prompt: input.prompt,
            control_image: input.controlImage,
            guidance: fluxGuidance(input.conditioningScale),
            output_format: 'jpg',
            megapixels: '1',
          };
        } else {
          // COMMUNITY SDXL şeması (image + conditioning/prompt_strength). version pin ZORUNLU (yoksa 422).
          modelInput = {
            image: input.controlImage,
            prompt: input.prompt,
            negative_prompt: input.negativePrompt ?? '',
            num_inference_steps: 30,
            guidance_scale: 7,
            prompt_strength: input.promptStrength ?? 0.75,
            conditioning_scale: input.conditioningScale ?? 0.8,
            output_format: 'jpeg',
            width: 1024,
            height: 1024,
          };
        }
        const payload: Record<string, unknown> = { input: modelInput };
        if (!officialSlug) payload.version = opts?.version;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { ...auth, Prefer: 'wait=45' },
          body: JSON.stringify(payload),
          signal: t.signal,
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw Object.assign(new Error(`Replicate ${res.status}: ${detail.slice(0, 200)}`), { status: res.status });
        }
        let pred = (await res.json()) as Prediction;
        predId = pred.id;
        while (!['succeeded', 'failed', 'canceled'].includes(pred.status)) {
          await new Promise((r) => setTimeout(r, 1500));
          if (!pred.urls?.get) throw new Error('Replicate poll URL yok.');
          const g = await fetch(pred.urls.get, { headers: auth, signal: t.signal });
          pred = (await g.json()) as Prediction;
        }
        if (pred.status !== 'succeeded') {
          throw new Error(`Render ${pred.status}${pred.error ? ': ' + String(pred.error).slice(0, 200) : ''}.`);
        }
        const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
        if (typeof out !== 'string') throw new Error('Render çıktısı boş.');
        const image = await rehost(out, t.signal);
        return { image, provider: 'replicate', model: officialSlug ?? opts?.version ?? 'replicate-preserve' };
      } catch (e) {
        // BEST-EFFORT iptal — GERÇEK maliyet bağı plan-gate + günlük kota (başlamış iş yine faturalanabilir).
        if (predId) void fetch(`${API}/predictions/${predId}/cancel`, { method: 'POST', headers: auth }).catch(() => {});
        throw e;
      } finally {
        t.dispose();
      }
    },
  };
}
