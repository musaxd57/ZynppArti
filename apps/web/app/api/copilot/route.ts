import {
  buildProviders,
  parseForcedProvider,
  askCopilotStream,
  askDesignVariants,
  buildRenderProviders,
  resolveRenderChain,
  parseForcedRenderProvider,
  NoProviderError,
  type ChatMessage,
  type CopilotContext,
  type RenderEnv,
  type RenderProviderName,
} from '@zynpparti/ai';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isPaidPlan, isAdminEmail } from '@/lib/plan';

/**
 * Copilot doğal-dil ucu (Fikir 1 + 3-sağlayıcı router, ADR-0006/0042). SUNUCU TARAFI — API
 * anahtarları yalnız burada (`process.env`, .env.local), tarayıcıya asla gitmez. İstemci
 * {messages, context} POST'lar; router soruyu zorluğa göre sağlayıcıya yönlendirir (Akash/OpenAI/
 * Claude) + biri çökerse fallback yapar ve metin yanıt döner.
 *
 * Node runtime şart (resmî SDK'lar); dinamik (her istek ayrı LLM çağrısı).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/**
 * Vercel fonksiyon süresi tavanı. HOBBY planında sert sınır 60s (docs/DEPLOY.md) → 90/120 DEĞİL.
 * "Geometriyi koru" difüzyonu RENDER_PRESERVE_DEADLINE_MS=45s ile bunun ALTINDA tutulur (cancel+rehost payı).
 */
export const maxDuration = 60;

/** ControlNet render negatif promptu — mimari artefakt/halüsinasyonu bastırır (tek kaynak). */
const RENDER_NEGATIVE_PROMPT =
  'blurry, deformed walls, extra rooms, warped perspective, floor plan, blueprint, text, labels, dimensions, watermark, toy model, dollhouse, people';

/** Güvenli aralığa kıs (istemci 3-stop değerleri gönderse de sunucu doğrular). */
function clampNum(v: unknown, lo: number, hi: number, dflt: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt;
}

/** Maliyet/kötüye-kullanım koruması: aşırı uzun geçmiş/mesaj sınırlanır (uç henüz auth'suz). */
const MAX_MESSAGES = 20;
const MAX_CONTENT = 8000;
/** Tüm mesajların TOPLAM karakter bütçesi — token maliyetini bağlar (20×8000=160KB'yi engeller). */
const MAX_TOTAL_CONTENT = 24000;

/**
 * Basit bellek-içi hız sınırı (IP başına, kayan pencere). Bu uç GERÇEK PARA harcar (her istek bir LLM/
 * görsel çağrısı) ve henüz auth yok → kötüye-kullanım/DoS maliyet patlatabilir. Tek-instans için yeter;
 * çok-instans/üretimde Redis'e taşınır. (Denetim bulgusu.)
 */
const RATE_LIMIT = 30; // istek
const RATE_WINDOW_MS = 60_000; // / dakika
const rateHits = new Map<string, number[]>();

function clientIp(req: Request): string {
  // GÜVENLİK: x-forwarded-for SPOOF'lanabilir — saldırgan kendi XFF başlığını gönderip sol (orijinal
  // istemci) girdileri uydurabilir; sahte IP'lerle rate-limit'i atlayıp sınırsız ÜCRETLİ AI çağrısı
  // yapabilir. Vercel gerçek bağlantı IP'sini güvenilir `x-real-ip`'e koyar (ve XFF'in EN SAĞINA ekler).
  // → x-real-ip önce; yoksa XFF'in en sağ (Vercel'in gördüğü) girdisi; o da yoksa 'local'.
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const parts = (req.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1]! : 'local';
}

/** İstek geçerli mi (sınırı aşmadı mı)? Aşarsa false. Eski kayıtları temizler. */
function allowRequest(ip: string, now: number): boolean {
  const hits = (rateHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    rateHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  rateHits.set(ip, hits);
  // Ara sıra ölü IP girişlerini temizle (bellek sızıntısı önlemi).
  if (rateHits.size > 5000) {
    for (const [k, v] of rateHits) if (v.every((t) => now - t >= RATE_WINDOW_MS)) rateHits.delete(k);
  }
  return true;
}

/**
 * `context` istemciden gelir ve `formatContext` (prompt.ts) ile DOĞRUDAN sistem prompt'una gömülür.
 * Doğrulanmazsa iki risk var: (1) devasa diziler/metinler → token maliyeti patlar (MAX_TOTAL_CONTENT
 * yalnız `messages`'ı bağlar, context'i DEĞİL); (2) sistem-prompt injection (persona/model-gizliliği
 * kuralını ezme). Bu fonksiyon dizileri ve metinleri sınırlar, geçersiz alanları düşürür. (Denetim bulgusu.)
 */
const CTX_MAX_ROOMS = 200;
const CTX_MAX_METRICS = 50;
const CTX_MAX_FINDINGS = 50;
const CTX_STR = 200; // genel metin alanı sınırı (oda adı/metrik/atıf)

function clampStr(v: unknown, max: number): string | undefined {
  return typeof v === 'string' ? v.slice(0, max) : undefined;
}

function sanitizeContext(raw: unknown): CopilotContext {
  if (typeof raw !== 'object' || raw === null) return {};
  const o = raw as Record<string, unknown>;
  const ctx: {
    rooms?: { name: string; type?: string; areaM2: number }[];
    metrics?: string[];
    findings?: { severity: string; message: string; citation: string }[];
    selection?: string;
  } = {};

  if (Array.isArray(o['rooms'])) {
    ctx.rooms = o['rooms']
      .slice(0, CTX_MAX_ROOMS)
      .map((r) => {
        if (typeof r !== 'object' || r === null) return null;
        const rr = r as Record<string, unknown>;
        const name = clampStr(rr['name'], 80);
        if (name === undefined) return null;
        const area = typeof rr['areaM2'] === 'number' && Number.isFinite(rr['areaM2']) ? rr['areaM2'] : 0;
        const type = clampStr(rr['type'], 40);
        return { name, areaM2: area, ...(type ? { type } : {}) };
      })
      .filter((r): r is { name: string; type?: string; areaM2: number } => r !== null);
  }

  if (Array.isArray(o['metrics'])) {
    ctx.metrics = o['metrics']
      .slice(0, CTX_MAX_METRICS)
      .map((m) => clampStr(m, CTX_STR))
      .filter((m): m is string => m !== undefined);
  }

  if (Array.isArray(o['findings'])) {
    ctx.findings = o['findings']
      .slice(0, CTX_MAX_FINDINGS)
      .map((f) => {
        if (typeof f !== 'object' || f === null) return null;
        const ff = f as Record<string, unknown>;
        const message = clampStr(ff['message'], 300);
        if (message === undefined) return null;
        return {
          severity: clampStr(ff['severity'], 20) ?? 'info',
          message,
          citation: clampStr(ff['citation'], CTX_STR) ?? '',
        };
      })
      .filter((f): f is { severity: string; message: string; citation: string } => f !== null);
  }

  const selection = clampStr(o['selection'], 500);
  if (selection) ctx.selection = selection;

  return ctx;
}

/** Gelen ham mesajları güvenli ChatMessage[]'e indirger (rol+metin doğrulama + boyut sınırı). */
function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const recent = raw.slice(-MAX_MESSAGES);
  const out: ChatMessage[] = [];
  for (const m of recent) {
    if (typeof m !== 'object' || m === null) return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    out.push({ role, content: content.slice(0, MAX_CONTENT) });
  }
  // Toplam bütçeyi aşarsa EN ESKİ mesajları at (son mesaj/soru hep korunur).
  let total = out.reduce((s, m) => s + m.content.length, 0);
  while (total > MAX_TOTAL_CONTENT && out.length > 1) {
    total -= out.shift()!.content.length;
  }
  return out;
}

export async function POST(req: Request): Promise<Response> {
  // Hız sınırı: para harcayan ucu kötüye-kullanıma karşı koru.
  if (!allowRequest(clientIp(req), Date.now())) {
    return Response.json(
      { error: 'Çok fazla istek — biraz bekleyip tekrar dene.' },
      { status: 429, headers: { 'Retry-After': '30' } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Geçersiz istek (JSON çözülemedi).' }, { status: 400 });
  }

  const mode = (body as { mode?: unknown })?.mode;

  // Render modu: tek "prompt" → görsel (OpenAI görsel API'si). Providers/streaming gerekmez.
  if (mode === 'render') {
    const p = (body as { prompt?: unknown })?.prompt;
    if (typeof p !== 'string' || !p.trim()) {
      return Response.json({ error: 'Render için "prompt" gerekli.' }, { status: 400 });
    }
    // ENFORCEMENT (ADR-0048): AI render yalnız Pro/Studio. Ücretsiz/anonim → 402 (istemci yükselt-CTA gösterir).
    // Sunucu tarafı kapı = gerçek koruma (istemci gizlemesi bypass edilebilir; bu uç GERÇEK PARA harcar).
    const supabase = await getSupabaseServer();
    const { data: ud } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    let plan = 'free';
    const isAdmin = !!(supabase && ud.user && isAdminEmail(ud.user.email));
    if (isAdmin) {
      // Tam-yetkili admin e-posta → plan sorgusunu atla, doğrudan ücretli say (render açık).
      plan = 'studio';
    } else if (supabase && ud.user) {
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', ud.user.id)
        .maybeSingle();
      if (profErr) {
        // Plan SORGUSU geçici hata verdi → ödeyen kullanıcıyı 'free' sayıp yanlış "yükselt" gösterme;
        // tekrar denenebilir 503 dön (kapıyı da açmaz — yalnız hatalı upgrade-CTA'yı önler). Denetim L25.
        console.error('Render plan kontrolü hatası:', profErr.message);
        return Response.json({ error: 'Plan doğrulanamadı, lütfen tekrar dene.' }, { status: 503 });
      }
      plan = (prof?.plan as string | undefined) ?? 'free';
    }
    if (!isPaidPlan(plan)) {
      return Response.json(
        { error: 'AI render Pro planına özel. Görsel üretmek için Pro’ya geç.', upgrade: true },
        { status: 402 },
      );
    }
    // Mod: 'creative' (OpenAI text→image — MEVCUT davranış, varsayılan) | 'preserve' (ControlNet, geometriyi koru).
    const renderMode = (body as { renderMode?: unknown }).renderMode === 'preserve' ? 'preserve' : 'creative';
    const controlImage = (body as { controlImage?: unknown }).controlImage;
    if (renderMode === 'preserve') {
      if (typeof controlImage !== 'string' || !/^data:image\/(png|jpeg);base64,/.test(controlImage)) {
        return Response.json({ error: 'Geçerli kontrol görseli gerekli (png/jpeg).' }, { status: 400 });
      }
      if (controlImage.length > 3_500_000) {
        return Response.json({ error: 'Kontrol görseli çok büyük (≤1024 px gönderin).' }, { status: 413 });
      }
      // GÜNLÜK KOTA — pahalı ControlNet çağrısından ÖNCE, ATOMİK, FAIL-CLOSED (profErr deseni). YALNIZ
      // preserve (creative MEVCUT davranışta kalır, kota yok) ve admin HARİÇ (Moses A/B için sınırsız).
      // RPC yoksa/şema uygulanmadıysa → 503 (kapı açılmaz; cost-abuse'a karşı gerçek backstop).
      if (!isAdmin && supabase && ud.user) {
        const cap = Number(process.env.RENDER_DAILY_CAP ?? 30);
        const { data: allowed, error: capErr } = await supabase.rpc('claim_render_slot', {
          p_user: ud.user.id,
          p_cap: cap,
        });
        if (capErr) {
          console.error('Render kota RPC hatası:', capErr.message);
          return Response.json({ error: 'Render kotası doğrulanamadı, tekrar dene.' }, { status: 503 });
        }
        if (!allowed) {
          return Response.json(
            { error: `Günlük render limitine ulaşıldı (${cap}). Yarın tekrar dene.` },
            { status: 429 },
          );
        }
      }
    }

    // ENV-GATE: anahtarı olmayan sağlayıcı kurulmaz → preserve'de REPLICATE yoksa zincir BOŞ → 503, sıfır harcama.
    const renderProviders = buildRenderProviders(process.env as unknown as RenderEnv);
    const chain = resolveRenderChain(
      renderMode,
      Object.keys(renderProviders) as RenderProviderName[],
      parseForcedRenderProvider(process.env.RENDER_PRESERVE_PROVIDER),
    );
    if (chain.length === 0) {
      return Response.json(
        {
          error:
            renderMode === 'preserve'
              ? 'Geometriyi koru modu sunucuda yapılandırılmadı (REPLICATE_API_TOKEN gerekli).'
              : 'Render için OPENAI_API_KEY gerekli (görsel üretimi).',
        },
        { status: 503 },
      );
    }

    const ct = (body as { controlType?: unknown }).controlType;
    const controlType: 'depth' | 'canny' | 'mlsd' | undefined =
      ct === 'depth' || ct === 'canny' || ct === 'mlsd' ? ct : undefined;
    const renderInput = {
      prompt: p.slice(0, 4000),
      mode: renderMode as 'creative' | 'preserve',
      negativePrompt: RENDER_NEGATIVE_PROMPT,
      controlImage: typeof controlImage === 'string' ? controlImage : undefined,
      controlType,
      conditioningScale: clampNum((body as { conditioningScale?: unknown }).conditioningScale, 0.3, 0.95, 0.8),
      promptStrength: clampNum((body as { promptStrength?: unknown }).promptStrength, 0.4, 0.95, 0.75),
      hd: (body as { hd?: unknown }).hd === true,
    };

    let lastErr: unknown;
    for (const name of chain) {
      try {
        const r = await renderProviders[name]!.generate(renderInput, req.signal);
        return Response.json({ mode: 'render', image: r.image }); // YANIT ŞEKLİ KIRILMAZ
      } catch (e) {
        lastErr = e;
        console.error(`Render sağlayıcı "${name}" başarısız:`, e);
      }
    }
    // HAM sağlayıcı mesajı YALNIZ sunucu logunda; istemciye sade KATEGORİ (HTTP durumundan). (güvenlik.)
    const status = typeof (lastErr as { status?: unknown })?.status === 'number' ? (lastErr as { status: number }).status : 0;
    const category =
      status === 401 || status === 403
        ? 'model erişimi/yetki yok'
        : status === 429
          ? 'kota/limit doldu — biraz sonra tekrar dene'
          : status === 400 || status === 422
            ? 'istek reddedildi (model/girdi uyumsuz olabilir)'
            : status === 402
              ? 'fatura/bakiye sorunu'
              : status >= 500
                ? 'sağlayıcı geçici hata'
                : 'görsel üretilemedi';
    return Response.json({ error: `Görsel üretilemedi (${category}).` }, { status: 502 });
  }

  // Tasarım (çizim) modu: messages yerine tek "prompt" alır; AI kat planı JSON'u üretir.
  let designPrompt: string | null = null;
  let messages: ChatMessage[] | null = null;
  if (mode === 'design') {
    const p = (body as { prompt?: unknown })?.prompt;
    if (typeof p !== 'string' || !p.trim()) {
      return Response.json({ error: 'Tasarım için "prompt" gerekli.' }, { status: 400 });
    }
    designPrompt = p.slice(0, MAX_CONTENT);
  } else {
    messages = parseMessages((body as { messages?: unknown })?.messages);
    if (!messages) {
      return Response.json({ error: 'Geçerli "messages" gerekli.' }, { status: 400 });
    }
  }
  const context = sanitizeContext((body as { context?: unknown })?.context);

  const providers = buildProviders({
    AI_PROVIDER: process.env.AI_PROVIDER,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AKASHML_API_KEY: process.env.AKASHML_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    AKASHML_MODEL: process.env.AKASHML_MODEL,
  });
  if (Object.keys(providers).length === 0) {
    return Response.json(
      {
        error:
          'AI yapılandırılmadı. apps/web/.env.local içine AKASHML_API_KEY (veya OPENAI_API_KEY / ANTHROPIC_API_KEY) ekleyin.',
      },
      { status: 503 },
    );
  }

  const forced = parseForcedProvider(process.env.AI_PROVIDER);

  // Tasarım modu: tam JSON gerekir → akışsız.
  if (designPrompt !== null) {
    const hintRaw = (body as { hint?: unknown })?.hint;
    const hint = typeof hintRaw === 'string' ? hintRaw.slice(0, 1000) : undefined;
    try {
      const d = await askDesignVariants(providers, designPrompt, forced, hint, 2, req.signal);
      return Response.json({ mode: 'design', variants: d.variants });
    } catch (e) {
      if (e instanceof NoProviderError) return Response.json({ error: 'AI yapılandırılmadı.' }, { status: 503 });
      console.error('Tasarım üretimi başarısız:', e);
      return Response.json({ error: 'Plan üretilemedi. Lütfen tekrar deneyin.' }, { status: 500 });
    }
  }

  // Sor modu: yanıtı AKIŞLI (streaming) düz metin olarak döndür (cevap kelime kelime akar).
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const safeEnqueue = (s: string): void => {
        try {
          controller.enqueue(encoder.encode(s));
        } catch {
          /* istemci koptu / controller kapalı → yoksay */
        }
      };
      try {
        await askCopilotStream(providers, messages!, context, safeEnqueue, forced, req.signal);
      } catch (e) {
        // İstemci iptali değilse hata mesajı yaz (iptalde sessiz geç — log gürültüsü olmasın).
        if (!req.signal.aborted) {
          console.error('Copilot stream başarısız:', e);
          safeEnqueue('\n\n[Yanıt alınamadı, lütfen tekrar deneyin.]');
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* zaten kapalı/errored → yoksay */
        }
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}
