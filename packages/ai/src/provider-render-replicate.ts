import { RENDER_PRESERVE_DEADLINE_MS } from './render';
import { withTimeout } from './timeout';
import type { RenderInput, RenderProvider, RenderResult } from './render-types';

/**
 * "Geometriyi koru" (ControlNet) render sağlayıcısı — Replicate REST'e HAM fetch (yeni SDK bağımlılığı YOK).
 * Yalnız SUNUCU tarafı (token gizli). Senkron submit + poll (Prefer:wait), Hobby 60s tavanının ALTINDA bir
 * deadline ile sınırlı; deadline/iptalde best-effort cancel. Çıktı sunucuda data-url'e rehost edilir
 * (gizlilik: sağlayıcının geçici CDN URL'i istemciye gitmez + 1 saatlik URL süresi sorununu çözer).
 *
 * NOT: Model girdi-alan adları (image/control_image, prompt_strength…) seçilen modele göre DOĞRULANMALI
 * (activationSteps md.0). Varsayılan community model (adirik) → /v1/predictions + version pin (REQUIRED);
 * resmi flux HD → /v1/models/{slug}/predictions (pin istemez).
 */

const API = 'https://api.replicate.com/v1';

/** Çıktı görselini SUNUCUDA indirip data-url'e çevirir (sağlayıcı URL'i istemciye sızmaz). */
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

export function replicateRenderProvider(
  token: string,
  opts?: { interiorVersion?: string; hdModel?: string },
): RenderProvider {
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  return {
    name: 'replicate',
    supportsControl: true,
    async generate(input: RenderInput, parent?: AbortSignal): Promise<RenderResult> {
      const t = withTimeout(RENDER_PRESERVE_DEADLINE_MS, parent);
      let predId: string | undefined;
      try {
        const useHd = !!(input.hd && opts?.hdModel);
        const endpoint = useHd ? `${API}/models/${opts!.hdModel}/predictions` : `${API}/predictions`;
        const modelInput: Record<string, unknown> = {
          // adirik=image; flux=control_image → ikisini de gönder (model kendi okur, fazlası yok sayılır).
          image: input.controlImage,
          control_image: input.controlImage,
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
        const payload: Record<string, unknown> = { input: modelInput };
        // Community model → sürüm pin ZORUNLU (yoksa 422). Resmi flux → pin istemez.
        if (!useHd) payload.version = opts?.interiorVersion;

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
        // Prefer:wait kısa kalırsa deadline'a kadar poll et.
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
        return { image, provider: 'replicate', model: useHd ? opts!.hdModel! : (opts?.interiorVersion ?? 'replicate-preserve') };
      } catch (e) {
        // BEST-EFFORT iptal — GERÇEK maliyet bağı plan-gate + günlük kota (başlamış iş yine faturalanabilir,
        // Vercel hard-kill bu catch'i atlayabilir). Bu yüzden cancel'a güvenmiyoruz, sadece deniyoruz.
        if (predId) void fetch(`${API}/predictions/${predId}/cancel`, { method: 'POST', headers: auth }).catch(() => {});
        throw e;
      } finally {
        t.dispose();
      }
    },
  };
}
