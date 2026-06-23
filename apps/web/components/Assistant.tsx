'use client';

import { useEffect, useRef, useState } from 'react';
import { runCopilotChecks } from '@zynpparti/copilot';
import {
  AddEntity,
  BatchCommand,
  UpdateEntity,
  centerlineAreaM2,
  createEntityId,
  type EntityStore,
  type History,
  type Opening,
  type Parcel,
  type RoomType,
  type Space,
  type Wall,
} from '@zynpparti/document';
import { pointInPolygon } from '@zynpparti/geometry';

/**
 * ZynppArti Asistanı — uygulamanın kendi AI panelı (sağlayıcı adı GÖSTERİLMEZ; "kendi AI'mız" hissi).
 * Logo butonuna tıkla → solda büyük panel açılır. İki mod:
 *  - **Sor:** proje bağlamıyla (mahal/metrik/yönetmelik bulguları) soru-cevap (salt-okunur).
 *  - **Çiz:** tarife göre AI bir kat planı taslağı üretir; **Command ile** çizilir → undo'lanabilir.
 *
 * server-only `@zynpparti/ai` paketi BURADA import EDİLMEZ (anahtar/SDK tarayıcıya sızmasın); yalnız
 * /api/copilot route'una fetch yapılır + saf document/geometry yardımcıları kullanılır.
 */

type Mode = 'ask' | 'draw';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantProps {
  store: EntityStore;
  history: History;
  selectedIds: string[];
  /** Çizimden sonra üretilen planı ekrana getirmek için (zoom extents). */
  zoomToFit?: () => void;
}

const WALL_THICKNESS = 20; // cm — AI taslağı için varsayılan duvar kalınlığı

/** Geçerli mahal tipleri — LLM'in uydurduğu tip (ör. "bedroom") modele yazılmasın. */
const VALID_ROOM_TYPES = new Set<RoomType>([
  'living',
  'kitchen',
  'bathroom',
  'wet',
  'sleeping',
  'circulation',
  'service',
  'other',
]);

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
    /* yoksay */
  }
  let selection: string | undefined;
  if (selectedIds.length > 1) selection = `${selectedIds.length} entity seçili`;
  else if (selectedIds.length === 1) selection = store.get(selectedIds[0]!)?.type;
  return { rooms, metrics, findings, selection };
}

interface LayoutRoom {
  name: string;
  type?: string;
  cx: number;
  cy: number;
}

interface LayoutOpening {
  kind: 'door' | 'window';
  cx: number;
  cy: number;
  width: number;
}

/** Bir noktanın segment üzerindeki izdüşüm oranı (t∈[0,1]) + dik uzaklığı. */
function projectToSeg(
  px: number,
  py: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
): { t: number; dist: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { t: 0, dist: Math.hypot(px - a.x, py - a.y) };
  let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return { t, dist: Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy)) };
}

/** Çiz modu için bağlam ipucu: parsel varsa kullanılabilir alanı (çekme paylı) AI'a bildir. */
function buildDesignHint(store: EntityStore): string | undefined {
  const parcels = store.all().filter((e): e is Parcel => e.type === 'parcel');
  if (parcels.length === 0) return undefined;
  const pts = parcels.flatMap((p) => p.boundary);
  if (pts.length < 3) return undefined;
  const w = Math.round(Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x)) - 200);
  const h = Math.round(Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y)) - 200);
  if (w <= 0 || h <= 0) return undefined;
  return `kullanılabilir alan yaklaşık ${w} x ${h} cm (planı parsel içine sığdır, çekme payı bırak)`;
}

/**
 * AI'ın ürettiği planı Command sistemiyle çizer (undo'lanabilir) + odaları adlandırır (best-effort).
 * Mevcut çizim varsa plan onun SAĞINA kaydırılır (üst üste binmesin). Döndürür: çizilen duvar +
 * adlandırılan mahal sayısı.
 */
function applyLayout(
  store: EntityStore,
  history: History,
  walls: [number, number, number, number][],
  rooms: LayoutRoom[],
  openings: LayoutOpening[],
): { drawn: number; named: number; openingCount: number } {
  if (walls.length === 0) return { drawn: 0, named: 0, openingCount: 0 };

  // Yerleşim: parsel varsa onun sol-üst köşesine ~1 m çekmeyle; yoksa mevcut duvarların sağına;
  // hiçbiri yoksa orijine. (Üst üste binmesin / parsel içinde dursun.)
  const all = store.all();
  const parcels = all.filter((e): e is Parcel => e.type === 'parcel');
  const existing = all.filter((e): e is Wall => e.type === 'wall');
  let dx = 0;
  let dy = 0;
  if (parcels.length > 0) {
    const pts = parcels.flatMap((p) => p.boundary);
    dx = Math.min(...pts.map((p) => p.x)) + 100;
    dy = Math.min(...pts.map((p) => p.y)) + 100;
  } else if (existing.length > 0) {
    dx = Math.max(...existing.flatMap((w) => [w.start.x, w.end.x])) + 300;
  }

  // Duvar entity'lerini (id'leriyle) önce kur → kapı/pencereyi en yakın duvara bağlayabilelim.
  const wallEntities: Wall[] = walls.map(([x1, y1, x2, y2]) => ({
    id: createEntityId(),
    type: 'wall',
    layerId: 'default',
    start: { x: x1 + dx, y: y1 + dy },
    end: { x: x2 + dx, y: y2 + dy },
    thickness: WALL_THICKNESS,
  }));
  const cmds: AddEntity[] = wallEntities.map((w) => new AddEntity(w));

  // Kapı/pencereleri en yakın duvara (≤80 cm) bağla; t = duvar üzerindeki izdüşüm oranı.
  let openingCount = 0;
  for (const o of openings) {
    const px = o.cx + dx;
    const py = o.cy + dy;
    let best: Wall | null = null;
    let bestT = 0.5;
    let bestD = Infinity;
    for (const w of wallEntities) {
      const { t, dist } = projectToSeg(px, py, w.start, w.end);
      if (dist < bestD) {
        bestD = dist;
        best = w;
        bestT = t;
      }
    }
    if (best && bestD <= 80) {
      cmds.push(
        new AddEntity({
          id: createEntityId(),
          type: 'opening',
          layerId: 'default',
          wallId: best.id,
          t: bestT,
          width: o.width,
          kind: o.kind,
        } satisfies Opening),
      );
      openingCount++;
    }
  }
  history.dispatch(new BatchCommand('AI taslak plan', cmds));

  // Duvarlar eklenince RoomManager mahalleri senkron türetir → merkez noktasıyla ad/tip ata.
  let named = 0;
  try {
    const spaces = store.all().filter((e): e is Space => e.type === 'space');
    const renameCmds: UpdateEntity[] = [];
    const used = new Set<string>();
    for (const r of rooms) {
      const rt = r.type && VALID_ROOM_TYPES.has(r.type as RoomType) ? (r.type as RoomType) : undefined;
      const sp = spaces.find(
        (s) =>
          !used.has(s.id) &&
          s.boundary.length >= 3 &&
          pointInPolygon({ x: r.cx + dx, y: r.cy + dy }, s.boundary),
      );
      if (!sp) continue;
      used.add(sp.id);
      renameCmds.push(new UpdateEntity({ ...sp, name: r.name, ...(rt ? { roomType: rt } : {}) }));
    }
    if (renameCmds.length > 0) {
      history.dispatch(new BatchCommand('AI oda adları', renameCmds));
      named = renameCmds.length;
    }
  } catch (e) {
    console.error('AI oda adlandırma atlandı (duvarlar çizildi):', e);
  }
  return { drawn: wallEntities.length, named, openingCount };
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 5.3L19 9.2l-5.1 1.9L12 16l-1.9-4.9L5 9.2l5.1-1.9L12 2z" />
      <path d="M19 14l.9 2.4L22 17.3l-2.1.9L19 21l-.9-2.8-2.1-.9 2.1-.9L19 14z" opacity=".7" />
    </svg>
  );
}

export function Assistant({ store, history, selectedIds, zoomToFit }: AssistantProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('ask');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const send = async (): Promise<void> => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      if (mode === 'draw') {
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'design', prompt: text, hint: buildDesignHint(store) }),
        });
        const data: unknown = await res.json();
        if (!res.ok) throw new Error((data as { error?: string }).error ?? `Hata (${res.status})`);
        const d = data as {
          summary?: string;
          walls?: [number, number, number, number][];
          rooms?: LayoutRoom[];
          openings?: LayoutOpening[];
        };
        const { drawn, named, openingCount } = applyLayout(
          store,
          history,
          d.walls ?? [],
          d.rooms ?? [],
          d.openings ?? [],
        );
        if (drawn > 0) zoomToFit?.(); // çizilen planı ekrana getir
        const undoNote =
          named > 0
            ? 'Geri almak için Ctrl+Z (önce adlar, tekrar bas → duvarlar).'
            : 'Beğenmezsen Ctrl+Z ile geri al.';
        const extras = [
          named > 0 ? `${named} mahal adlandırıldı` : '',
          openingCount > 0 ? `${openingCount} kapı/pencere eklendi` : '',
        ]
          .filter(Boolean)
          .join(', ');
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: `${d.summary ?? 'Taslak çizildi.'}\n\n✓ ${drawn} duvar çizildi${
              extras ? `, ${extras}` : ''
            }. ${undoNote}`,
          },
        ]);
      } else {
        const next: Msg[] = [...messages, { role: 'user', content: text }];
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next, context: buildContext(store, selectedIds) }),
        });
        if (!res.ok) {
          let msg = `Hata (${res.status})`;
          try {
            msg = ((await res.json()) as { error?: string }).error ?? msg;
          } catch {
            /* JSON değilse genel mesaj */
          }
          throw new Error(msg);
        }
        // Akışlı yanıt: boş asistan balonu ekle, gelen parçaları içine yaz.
        setMessages((m) => [...m, { role: 'assistant', content: '' }]);
        const reader = res.body?.getReader();
        if (reader) {
          const dec = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = dec.decode(value, { stream: true });
            if (!chunk) continue;
            setMessages((m) => {
              const c = [...m];
              const last = c[c.length - 1];
              if (last && last.role === 'assistant') c[c.length - 1] = { ...last, content: last.content + chunk };
              return c;
            });
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İstek başarısız.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-14 left-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-900/40 transition-transform hover:scale-105"
        title="ZynppArti Asistanı (AI)"
      >
        <SparkleIcon className="h-5 w-5" />
        Asistan
      </button>
    );
  }

  const examples =
    mode === 'draw'
      ? ['8x10 m, 2 yatak odası, salon, mutfak ve banyo olan bir daire çiz', '60 m² stüdyo daire planı']
      : ['En küçük oda hangisi?', 'Koridor yönetmeliğe uygun mu?', 'Toplam alanım kaç m²?'];

  return (
    <div className="fixed bottom-0 left-0 top-0 z-50 flex w-[420px] max-w-[92vw] flex-col border-r border-white/20 bg-neutral-800 text-white shadow-2xl">
      {/* Başlık */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-gradient-to-r from-violet-600/30 to-blue-600/20 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 text-white">
          <SparkleIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">ZynppArti Asistanı</div>
          <div className="text-[11px] text-white/60">Tasarım + yönetmelik yardımcın</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-7 w-7 place-items-center rounded hover:bg-white/10"
          title="Kapat"
          aria-label="Asistanı kapat"
        >
          ✕
        </button>
      </div>

      {/* Mod seçimi */}
      <div className="flex gap-1 px-3 pt-3">
        {(['ask', 'draw'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === m ? 'bg-white/20 font-semibold' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {m === 'ask' ? '💬 Sor' : '✏️ Çiz'}
          </button>
        ))}
      </div>

      {/* Mesajlar */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="m-auto max-w-[280px] text-center text-sm text-white/70">
            <SparkleIcon className="mx-auto mb-2 h-8 w-8 text-white/50" />
            {mode === 'draw'
              ? 'Tarif et, planı çizeyim. Örnekler:'
              : 'Projen hakkında sor. Örnekler:'}
            <ul className="mt-2 flex flex-col gap-1">
              {examples.map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    onClick={() => setInput(ex)}
                    className="rounded bg-white/10 px-2 py-1.5 text-xs text-white/90 hover:bg-white/20"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
              m.role === 'user' ? 'self-end bg-blue-600 text-white' : 'self-start bg-white/10 text-white/95'
            }`}
          >
            <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
          </div>
        ))}
        {loading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
          <div className="self-start rounded-lg bg-white/10 px-3 py-2 text-sm text-white/70">
            {mode === 'draw' ? 'Plan çiziliyor…' : 'Düşünüyor…'}
          </div>
        )}
      </div>

      {error && <div className="mx-3 rounded bg-red-500/15 p-2 text-xs text-red-200">{error}</div>}

      {/* Girdi */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder={mode === 'draw' ? 'Örn: 90 m² 3+1 daire çiz' : 'Bir şey sor…'}
            className="min-w-0 flex-1 resize-none rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/15"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            {mode === 'draw' ? 'Çiz' : 'Gönder'}
          </button>
        </div>
        <div className="mt-1.5 text-[10px] leading-tight text-white/45">
          {mode === 'draw'
            ? 'AI taslak üretir (deneysel); Ctrl+Z ile geri alınır. Ölçüleri kontrol et.'
            : 'Öneriler bilgilendirme amaçlıdır; yürürlükteki mevzuattan doğrula.'}
        </div>
      </div>
    </div>
  );
}
