import {
  buildProviders,
  parseForcedProvider,
  askCopilotStream,
  askDesign,
  NoProviderError,
  type ChatMessage,
  type CopilotContext,
} from '@zynpparti/ai';

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

/** Maliyet/kötüye-kullanım koruması: aşırı uzun geçmiş/mesaj sınırlanır (uç henüz auth'suz). */
const MAX_MESSAGES = 20;
const MAX_CONTENT = 8000;

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
  return out;
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Geçersiz istek (JSON çözülemedi).' }, { status: 400 });
  }

  const mode = (body as { mode?: unknown })?.mode;

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
  const context = ((body as { context?: unknown })?.context ?? {}) as CopilotContext;

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
      const d = await askDesign(providers, designPrompt, forced, hint);
      return Response.json({ mode: 'design', summary: d.summary, walls: d.walls, rooms: d.rooms });
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
      try {
        await askCopilotStream(
          providers,
          messages!,
          context,
          (delta) => controller.enqueue(encoder.encode(delta)),
          forced,
        );
      } catch (e) {
        console.error('Copilot stream başarısız:', e);
        controller.enqueue(encoder.encode('\n\n[Yanıt alınamadı, lütfen tekrar deneyin.]'));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}
