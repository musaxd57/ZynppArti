'use client';

import { useEffect, useRef, useState } from 'react';
import { runCopilotChecks } from '@zynpparti/copilot';
import {
  centerlineAreaM2,
  type EntityStore,
  type Opening,
  type Parcel,
  type Space,
  type Wall,
} from '@zynpparti/document';
import { Panel } from './Panel';

/**
 * Copilot doğal-dil sohbeti (Fikir 1, ADR-0006/0019). Kullanıcı serbest soru sorar; istemci mevcut
 * proje bağlamını (mahaller + metrik + deterministik bulgular + seçim) toplayıp `/api/copilot`
 * sunucu route'una POST'lar; anahtar yalnız sunucuda. Salt-öneri (Seviye 1) — modeli değiştirmez.
 *
 * NOT: server-only `@zynpparti/ai` paketi (SDK'lar) BURADA import edilmez (tarayıcıya sızmasın);
 * yalnız yerel body tipleri kullanılır.
 */

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  /** Yanıtı üreten sağlayıcı/model (şeffaflık + maliyet görünürlüğü; yalnız assistant). */
  meta?: { provider: string; model: string };
}

interface CopilotChatProps {
  store: EntityStore;
  selectedIds: string[];
}

function buildContext(store: EntityStore, selectedIds: string[]) {
  const all = store.all();
  const spaces = all.filter((e): e is Space => e.type === 'space');
  const walls = all.filter((e): e is Wall => e.type === 'wall');
  const openings = all.filter((e): e is Opening => e.type === 'opening');
  const parcels = all.filter((e): e is Parcel => e.type === 'parcel');

  const rooms = spaces.map((s) => ({ name: s.name, type: s.roomType, areaM2: centerlineAreaM2(s) }));
  const total = rooms.reduce((a, r) => a + r.areaM2, 0);
  const metrics =
    rooms.length > 0
      ? [`Mahal sayısı: ${rooms.length}`, `Toplam alan (kaba): ~${total.toFixed(1)} m²`]
      : [];

  let findings: { severity: string; message: string; citation: string }[] = [];
  try {
    findings = runCopilotChecks(spaces, walls, openings, parcels).map((f) => ({
      severity: f.severity,
      message: f.message,
      citation: f.citation,
    }));
  } catch {
    /* bağlam bulgusu üretilemezse boş geç */
  }

  let selection: string | undefined;
  if (selectedIds.length > 1) selection = `${selectedIds.length} entity seçili`;
  else if (selectedIds.length === 1) {
    const e = store.get(selectedIds[0]!);
    if (e) selection = e.type;
  }

  return { rooms, metrics, findings, selection };
}

export function CopilotChat({ store, selectedIds }: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Yeni mesajda en alta kaydır.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const send = async (): Promise<void> => {
    const q = input.trim();
    if (!q || loading) return;
    const next: ChatMsg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context: buildContext(store, selectedIds) }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? `Hata (${res.status})`);
      }
      const d = data as { answer?: string; provider?: string; model?: string };
      const meta = d.provider && d.model ? { provider: d.provider, model: d.model } : undefined;
      setMessages((m) => [...m, { role: 'assistant', content: d.answer ?? '', meta }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İstek başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel title="Copilot — Sor (AI)" widthClass="w-full" defaultOpen={false}>
      <div className="flex flex-col gap-2">
        {messages.length > 0 && (
          <div ref={scrollRef} className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded p-2 text-sm ${
                  m.role === 'user' ? 'bg-blue-500/15 text-blue-50' : 'bg-white/5'
                }`}
              >
                <div className="mb-0.5 text-[10px] uppercase tracking-wide opacity-40">
                  {m.role === 'user' ? 'Sen' : 'Copilot'}
                </div>
                <div className="whitespace-pre-wrap leading-snug">{m.content}</div>
                {m.meta && (
                  <div className="mt-1 text-[10px] opacity-30" title="Bu yanıtı üreten sağlayıcı/model">
                    {m.meta.provider} · {m.meta.model}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="px-1 text-xs opacity-50">Copilot düşünüyor…</div>}
          </div>
        )}

        {error && (
          <div className="rounded bg-red-500/15 p-2 text-xs text-red-200">{error}</div>
        )}

        <div className="flex gap-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter gönder; Shift+Enter satır atla.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder="Örn: Bu plandaki en küçük oda hangisi? Koridor yönetmeliğe uygun mu?"
            className="min-w-0 flex-1 resize-none rounded bg-white/10 px-2 py-1 text-sm outline-none focus:bg-white/20"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="self-end rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-40"
          >
            Gönder
          </button>
        </div>

        <div className="px-1 text-[10px] leading-tight opacity-40">
          AI önerileri bilgilendirme amaçlıdır; yürürlükteki mevzuattan doğrulayın. Çizimi değiştirmez.
        </div>
      </div>
    </Panel>
  );
}
