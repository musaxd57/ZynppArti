'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
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
import { pointInPolygon, findFaces } from '@zynpparti/geometry';
import { VesnaLogo } from './VesnaLogo';
import { ProgramBuilder } from './ProgramBuilder';

/**
 * Vesna — uygulamanın kendi AI paneli (sağlayıcı/model adı GÖSTERİLMEZ; "kendi AI'mız" hissi).
 * Logo butonuna tıkla → solda büyük panel açılır. Her modun KENDİ sohbeti vardır (karışmaz). 3 mod:
 *  - **Sor:** proje bağlamıyla (mahal/metrik/yönetmelik) akışlı soru-cevap (salt-okunur).
 *  - **Çiz:** tarife göre AI kat planı taslağı üretir; **Command ile** çizilir → undo'lanabilir.
 *  - **Render:** tarife göre fotogerçekçi görsel üretir (deneysel, yaratıcı mod).
 *
 * server-only `@zynpparti/ai` paketi BURADA import EDİLMEZ (anahtar/SDK tarayıcıya sızmasın); yalnız
 * /api/copilot route'una fetch yapılır + saf document/geometry yardımcıları kullanılır.
 */

/**
 * Yanıtı güvenle JSON'a çözer: ÖNCE res.ok kontrol et (yoksa hata mesajını oku), sonra parse et.
 * Eskiden draw/render dalları `res.json()`'ı res.ok'tan önce çağırıyordu → bir ağ-geçidi 502'si (HTML
 * gövde) "Unexpected token <" SyntaxError'ı veriyordu, temiz hata yerine. (Denetim bulgusu.)
 */
async function readJson(res: Response): Promise<unknown> {
  if (!res.ok) {
    let msg = `Hata (${res.status})`;
    try {
      msg = ((await res.json()) as { error?: string }).error ?? msg;
    } catch {
      /* JSON değil (HTML hata sayfası vb.) → genel mesaj */
    }
    throw new Error(msg);
  }
  try {
    return await res.json();
  } catch {
    throw new Error('Sunucu yanıtı okunamadı.');
  }
}

type Mode = 'ask' | 'draw' | 'render';

interface Msg {
  /** Stabil React key — index key React'i şaşırtıp kaydırınca stili bozuyordu. */
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Render modu yanıtı: gösterilecek görsel (data-URL veya URL). */
  image?: string;
}

interface AssistantProps {
  store: EntityStore;
  history: History;
  selectedIds: string[];
  /** Panel açık mı (üst araç çubuğundaki Vesna butonu kontrol eder). */
  open: boolean;
  /** Paneli kapat (✕). */
  onClose: () => void;
  /** Çizimden sonra üretilen planı ekrana getirmek için (zoom extents). */
  zoomToFit?: () => void;
  /** Landing'den `/app?ciz=...` ile gelen program → Çiz modunda istemi önceden doldur (paste). */
  initialCiz?: string;
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

/** Bir entity'yi copilot için insan-okur tek satıra çevirir (seçim bağlamı zenginleştirme). */
function describeEntity(store: EntityStore, id: string): string {
  const e = store.get(id);
  if (!e) return 'bilinmeyen öğe';
  switch (e.type) {
    case 'space':
      return `Mahal "${e.name}"${e.roomType ? ` (${e.roomType})` : ''}, ~${centerlineAreaM2(e).toFixed(1)} m²`;
    case 'wall': {
      const L = Math.hypot(e.end.x - e.start.x, e.end.y - e.start.y) / 100;
      return `Duvar, ${L.toFixed(2)} m, kalınlık ${e.thickness} cm${e.height ? `, yükseklik ${e.height} cm` : ''}`;
    }
    case 'opening':
      return `${e.kind === 'door' ? 'Kapı' : 'Pencere'}, ${e.width} cm genişlik`;
    case 'parcel':
      return 'Parsel (arsa sınırı)';
    case 'dimension':
      return 'Ölçü çizgisi';
    case 'annotation':
      return `Metin notu: "${e.text.slice(0, 40)}"`;
    case 'block':
      return `Blok/mobilya (${e.kind})`;
    default:
      return e.type;
  }
}

function buildContext(store: EntityStore, selectedIds: string[]) {
  const all = store.all();
  const spaces = all.filter((e): e is Space => e.type === 'space');
  const walls = all.filter((e): e is Wall => e.type === 'wall');
  const openings = all.filter((e): e is Opening => e.type === 'opening');
  const parcels = all.filter((e): e is Parcel => e.type === 'parcel');
  const rooms = spaces.map((s) => ({ name: s.name, type: s.roomType, areaM2: centerlineAreaM2(s) }));
  const total = rooms.reduce((a, r) => a + r.areaM2, 0);

  // Zengin metrikler: mahal + duvar/boşluk sayıları + parsel/kullanılabilir alan → copilot doğru ölçek.
  const metrics: string[] = [];
  if (rooms.length > 0) {
    metrics.push(`Mahal sayısı: ${rooms.length}`, `Toplam alan (kaba): ~${total.toFixed(1)} m²`);
  }
  if (walls.length > 0) {
    const doors = openings.filter((o) => o.kind === 'door').length;
    const windows = openings.filter((o) => o.kind === 'window').length;
    metrics.push(`Duvar sayısı: ${walls.length}`, `Kapı/Pencere: ${doors}/${windows}`);
  }
  if (parcels.length > 0) {
    const pts = parcels.flatMap((p) => p.boundary);
    if (pts.length >= 3) {
      const w = (Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x))) / 100;
      const h = (Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y))) / 100;
      metrics.push(`Parsel sınırlayıcı kutu: ~${w.toFixed(1)} × ${h.toFixed(1)} m`);
    }
  }

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

  // Seçim: tek öğede detay (alan/ölçü/tip), çoklu seçimde tip dağılımı → copilot "neyi" konuştuğunu bilir.
  let selection: string | undefined;
  if (selectedIds.length === 1) {
    selection = describeEntity(store, selectedIds[0]!);
  } else if (selectedIds.length > 1) {
    const types = selectedIds.slice(0, 6).map((id) => store.get(id)?.type ?? '?');
    selection = `${selectedIds.length} öğe seçili (${types.join(', ')}${selectedIds.length > 6 ? '…' : ''})`;
  }
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

interface Layout {
  summary: string;
  walls: [number, number, number, number][];
  rooms: LayoutRoom[];
  openings: LayoutOpening[];
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

/**
 * Bir varyantı ÇİZMEDEN copilot kurallarıyla puanlar (Faz 4 "puanlama"): duvarlardan mahalleri
 * türetir (findFaces), oda tiplerini eşler, runCopilotChecks ile uyumsuzluk (info-dışı) sayar.
 * Hata/dejenere geometride null. (Saf: store'a dokunmaz.)
 */
function scoreLayout(v: Layout): number | null {
  try {
    const faces = findFaces(v.walls.map(([x1, y1, x2, y2]) => ({ a: { x: x1, y: y1 }, b: { x: x2, y: y2 } })));
    const spaces: Space[] = faces.map((boundary, i) => {
      const room = v.rooms.find((r) => pointInPolygon({ x: r.cx, y: r.cy }, boundary));
      return {
        id: `v${i}`,
        type: 'space',
        layerId: 'rooms',
        name: room?.name ?? 'Mahal',
        ...(room?.type ? { roomType: room.type as RoomType } : {}),
        boundary,
      };
    });
    const walls: Wall[] = v.walls.map(([x1, y1, x2, y2], i) => ({
      id: `w${i}`,
      type: 'wall',
      layerId: 'default',
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: WALL_THICKNESS,
    }));
    return runCopilotChecks(spaces, walls, [], []).filter((f) => f.severity !== 'info').length;
  } catch (e) {
    console.warn('scoreLayout doğrulaması başarısız (varyant puanlanmadı):', e);
    return null;
  }
}

/** Render istemi: kullanıcı tarifine projedeki oda/m² özetini ekler (program-farkında görsel). */
function buildRenderPrompt(userText: string, store: EntityStore): string {
  const rooms = buildContext(store, []).rooms;
  const planNote = rooms.length
    ? ` Plan: ${rooms.map((r) => `${r.name} ~${r.areaM2.toFixed(0)} m²`).join(', ')}.`
    : '';
  return `Fotogerçekçi mimari iç/dış mekan görseli. ${userText}.${planNote} Gerçekçi ışık, malzeme ve perspektif; profesyonel mimari render kalitesi, insan/yazı yok.`;
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
): { drawn: number; named: number; openingCount: number; doorCount: number; windowCount: number } {
  if (walls.length === 0) return { drawn: 0, named: 0, openingCount: 0, doorCount: 0, windowCount: 0 };

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

  // GEOMETRİK kapı/pencere kuralı: DIŞ duvar (bina çevresi/sınırlayıcı kutu kenarı) → PENCERE;
  // İÇ duvar (oda arası) → KAPI. LLM çoğu zaman hepsini "window" yapıyor (kullanıcı gözlemi) →
  // etiketi AI'a bırakmak yerine geometriyle belirleyip gerçekçi kapı/pencere karışımı sağlıyoruz.
  const xs = wallEntities.flatMap((w) => [w.start.x, w.end.x]);
  const ys = wallEntities.flatMap((w) => [w.start.y, w.end.y]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const EDGE = 30; // cm tolerans — duvar perimetre kenarında mı
  const near = (a: number, b: number): boolean => Math.abs(a - b) <= EDGE;
  const isExteriorWall = (w: Wall): boolean =>
    (near(w.start.x, minX) && near(w.end.x, minX)) ||
    (near(w.start.x, maxX) && near(w.end.x, maxX)) ||
    (near(w.start.y, minY) && near(w.end.y, minY)) ||
    (near(w.start.y, maxY) && near(w.end.y, maxY));

  // Kapı/pencereleri en yakın duvara (≤80 cm) bağla; t = duvar üzerindeki izdüşüm oranı.
  let doorCount = 0;
  let windowCount = 0;
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
      const kind: Opening['kind'] = isExteriorWall(best) ? 'window' : 'door';
      cmds.push(
        new AddEntity({
          id: createEntityId(),
          type: 'opening',
          layerId: 'default',
          wallId: best.id,
          t: bestT,
          width: o.width,
          kind,
        } satisfies Opening),
      );
      if (kind === 'door') doorCount++;
      else windowCount++;
    }
  }
  const openingCount = doorCount + windowCount;
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
  return { drawn: wallEntities.length, named, openingCount, doorCount, windowCount };
}

/** Cevap üretilirken zıplayan üç nokta — "çalışıyor" hissi (tüm modlarda efektli). */
function TypingDots({ label }: { label: string }) {
  return (
    <div className="msg-in flex items-center gap-2 self-start rounded-lg bg-white/10 px-3 py-2 text-sm text-white/70">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      {label}
    </div>
  );
}

/**
 * Sohbet metnindeki basit markdown'ı işler: `**kalın**` → <strong>. (LLM çıktısı ham `**...**`
 * yıldızlarıyla görünüyordu.) Bağımlılık yok, dangerouslySetInnerHTML yok (XSS güvenli) — metni
 * parçalara bölüp yalnız bold'u sarmalar. Satır sonları whitespace-pre-wrap ile korunur.
 */
function renderRich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.length > 4 && p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      p
    ),
  );
}

const EMPTY_THREADS: Record<Mode, Msg[]> = { ask: [], draw: [], render: [] };

export function Assistant({ store, history, selectedIds, open, onClose, zoomToFit, initialCiz }: AssistantProps) {
  const [mode, setMode] = useState<Mode>('ask');
  // Her mod KENDİ sohbetini tutar (Sor/Çiz/Render karışmaz).
  const [threads, setThreads] = useState<Record<Mode, Msg[]>>(EMPTY_THREADS);
  const [input, setInput] = useState('');
  // Hangi modda istek sürüyor (yalnız o modda "üretiliyor" göstergesi çıksın).
  const [loadingMode, setLoadingMode] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Puan bir kez hesaplanıp saklanır (her render'da findFaces çağırma — O(n²) önle).
  const [variants, setVariants] = useState<{ layout: Layout; score: number | null }[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const idRef = useRef(0);
  const typingRef = useRef<number | null>(null);
  // Yazılmakta olan mesaj (m,id,full): yeni bir daktilo başlayınca öncekini TAMAMA çek (yarım kalmasın).
  const typingTargetRef = useRef<{ m: Mode; id: string; full: string } | null>(null);

  // Landing'den `/app?ciz=...` ile gelen program → Çiz modunu aç + istemi YAPIŞTIR (önceden doldur).
  // Otomatik göndermiyoruz (ücretli çağrı kullanıcı onayıyla başlasın); kullanıcı "Üret"e basar.
  useEffect(() => {
    if (initialCiz) {
      setMode('draw');
      setInput(initialCiz);
    }
  }, [initialCiz]);

  const messages = threads[mode];
  const loading = loadingMode !== null;
  const nextId = (): string => `m${++idRef.current}`;
  const setThread = (m: Mode, fn: (arr: Msg[]) => Msg[]): void =>
    setThreads((t) => ({ ...t, [m]: fn(t[m]) }));

  // Yeni içerik geldikçe panele in — AMA kullanıcı yukarı kaydırıp okuyorsa zorla aşağı çekme.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [threads, mode, loadingMode, variants]);

  /** Yazılmakta olan mesajı anında tamamına çeker + interval'i temizler (yarım kalmasını önler). */
  const finishTyping = (): void => {
    if (typingRef.current) {
      window.clearInterval(typingRef.current);
      typingRef.current = null;
    }
    const t = typingTargetRef.current;
    if (t) {
      setThread(t.m, (arr) => arr.map((x) => (x.id === t.id ? { ...x, content: t.full } : x)));
      typingTargetRef.current = null;
    }
  };

  // Bileşen sökülürse: devam eden isteği iptal et + yazma animasyonunu durdur (mesajı tamamlayarak).
  useEffect(
    () => () => {
      abortRef.current?.abort();
      finishTyping();
    },
    [],
  );

  /** Bir asistan mesajını daktilo efektiyle yazar (cevap "tık diye" düşmesin, sırayla gelsin). */
  const typeOut = (m: Mode, id: string, full: string): void => {
    finishTyping(); // önceki yarım mesajı tamamla, sonra yenisine başla
    typingTargetRef.current = { m, id, full };
    let i = 0;
    const step = Math.max(2, Math.ceil(full.length / 80));
    typingRef.current = window.setInterval(() => {
      i = Math.min(full.length, i + step);
      const slice = full.slice(0, i);
      setThread(m, (arr) => arr.map((x) => (x.id === id ? { ...x, content: slice } : x)));
      if (i >= full.length && typingRef.current) {
        window.clearInterval(typingRef.current);
        typingRef.current = null;
        typingTargetRef.current = null; // bitti → tamamlanacak bir hedef kalmadı
      }
    }, 18);
  };

  /** Seçilen planı çizer (Command ile), ekrana getirir, copilot uyum özetini daktilo efektiyle yazar. */
  const drawVariant = (v: Layout): void => {
    setVariants(null);
    try {
      drawVariantInner(v);
    } catch (e) {
      // AI taslağı çizilirken hata (bozuk geometri/dispatch) → çökme, kullanıcıya bildir + logla.
      console.error('AI taslak çizim başarısız:', e);
      const id = nextId();
      setThread('draw', (arr) => [...arr, { id, role: 'assistant', content: 'Taslak çizilirken bir sorun oldu, tekrar dener misin? (Ayrıntı tarayıcı konsolunda.)' }]);
    }
  };

  const drawVariantInner = (v: Layout): void => {
    const { drawn, named, openingCount, doorCount, windowCount } = applyLayout(store, history, v.walls, v.rooms, v.openings);
    if (drawn > 0) zoomToFit?.();
    // Kapı/pencere sayısını AYRI göster (ör. "6 kapı, 6 pencere") — kullanıcı net görsün.
    const openingText =
      openingCount === 0
        ? ''
        : [doorCount > 0 ? `${doorCount} kapı` : '', windowCount > 0 ? `${windowCount} pencere` : '']
            .filter(Boolean)
            .join(', ') + ' eklendi';
    const extras = [named > 0 ? `${named} mahal adlandırıldı` : '', openingText]
      .filter(Boolean)
      .join(', ');
    const undoNote =
      named > 0
        ? 'Geri almak için Ctrl+Z (önce adlar, tekrar bas → duvarlar).'
        : 'Beğenmezsen Ctrl+Z ile geri al.';
    let compliance = '';
    try {
      const issues = buildContext(store, []).findings.filter((f) => f.severity !== 'info').length;
      compliance =
        issues > 0
          ? `\n\n⚠ Copilot ${issues} olası uyumsuzluk buldu — soldaki "Copilot — Yönetmelik" paneline bak.`
          : '\n\n✓ Copilot: belirgin yönetmelik sorunu görünmüyor.';
    } catch {
      /* atla */
    }
    const content = `${v.summary}\n\n✓ ${drawn} duvar çizildi${extras ? `, ${extras}` : ''}. ${undoNote}${compliance}`;
    const id = nextId();
    setThread('draw', (arr) => [...arr, { id, role: 'assistant', content: '' }]);
    typeOut('draw', id, content);
  };

  const send = async (): Promise<void> => {
    const text = input.trim();
    if (!text || loading) return;
    const m = mode; // isteği başlatan modu sabitle (async sırasında mod değişebilir)
    const history0 = threads[m];
    setThread(m, (arr) => [...arr, { id: nextId(), role: 'user', content: text }]);
    setInput('');
    setError(null);
    setLoadingMode(m);
    const ctrl = new AbortController();
    abortRef.current?.abort(); // varsa önceki in-flight isteği iptal et (yetim controller bırakma)
    abortRef.current = ctrl;
    try {
      if (m === 'draw') {
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'design', prompt: text, hint: buildDesignHint(store) }),
          signal: ctrl.signal,
        });
        const data = await readJson(res);
        const vs = (data as { variants?: Layout[] }).variants ?? [];
        if (vs.length === 0) throw new Error('Plan üretilemedi, tekrar dener misin?');
        if (vs.length === 1) {
          drawVariant(vs[0]!); // tek varyant → doğrudan çiz
        } else {
          // Birden çok alternatif → puanla (bir kez) + copilot uyumuna göre sırala (en az uyarı üstte).
          const scored = vs
            .map((layout) => ({ layout, score: scoreLayout(layout) }))
            .sort((a, b) => (a.score ?? 99) - (b.score ?? 99));
          setVariants(scored);
          const id = nextId();
          setThread('draw', (arr) => [...arr, { id, role: 'assistant', content: '' }]);
          typeOut('draw', id, `${vs.length} alternatif plan hazır — en uyumlu üstte, birini seç.`);
        }
      } else if (m === 'render') {
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'render', prompt: buildRenderPrompt(text, store) }),
          signal: ctrl.signal,
        });
        const data = await readJson(res);
        const image = (data as { image?: string }).image;
        const id = nextId();
        setThread('render', (arr) => [
          ...arr,
          { id, role: 'assistant', content: '', ...(image ? { image } : {}) },
        ]);
        typeOut('render', id, image ? 'İşte taslak görsel (deneysel):' : 'Görsel alınamadı.');
      } else {
        const next: { role: 'user' | 'assistant'; content: string }[] = [
          ...history0.map((x) => ({ role: x.role, content: x.content })),
          { role: 'user', content: text },
        ];
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next, context: buildContext(store, selectedIds) }),
          signal: ctrl.signal,
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
        // Akışlı yanıt: boş asistan balonu ekle, gelen parçaları id ile içine yaz (sırayla görünür).
        const aid = nextId();
        setThread('ask', (arr) => [...arr, { id: aid, role: 'assistant', content: '' }]);
        const reader = res.body?.getReader();
        if (!reader) {
          // Gövde yok → boş balonu kaldır, temiz hata ver (boş baloncuk bırakma).
          setThread('ask', (arr) => arr.filter((x) => x.id !== aid));
          throw new Error('Yanıt akışı alınamadı.');
        }
        const dec = new TextDecoder();
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = dec.decode(value, { stream: true });
            if (!chunk) continue;
            setThread('ask', (arr) => arr.map((x) => (x.id === aid ? { ...x, content: x.content + chunk } : x)));
          }
          // Tampondaki son baytları boşalt — çok-baytlı Türkçe karakter (ç/ş/ğ/ı...) chunk sınırında
          // bölünmüşse kaybolmasın (yanıtın son karakteri düşmesin).
          const tail = dec.decode();
          if (tail) setThread('ask', (arr) => arr.map((x) => (x.id === aid ? { ...x, content: x.content + tail } : x)));
        } catch (streamErr) {
          // İptal → dış catch sessiz geçsin diye yeniden fırlat. Diğer akış kopması → kısmi yanıta not
          // düş (boş/yarım balonu hata diye gösterme; kullanıcı gelen kısmı görür).
          if (streamErr instanceof DOMException && streamErr.name === 'AbortError') throw streamErr;
          setThread('ask', (arr) =>
            arr.map((x) => (x.id === aid ? { ...x, content: `${x.content}\n\n_(yanıt yarıda kesildi)_` } : x)),
          );
        } finally {
          void reader.cancel().catch(() => {});
        }
      }
    } catch (e) {
      // Kullanıcı paneli kapattıysa (abort) sessiz geç; gerçek hatayı göster.
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        setError(e instanceof Error ? e.message : 'İstek başarısız.');
      }
    } finally {
      setLoadingMode(null);
      abortRef.current = null;
    }
  };

  if (!open) return null; // Açma butonu üst araç çubuğunda (Toolbar → Vesna).

  const examples =
    mode === 'draw'
      ? ['8x10 m, 2 yatak odası, salon, mutfak ve banyo olan bir daire çiz', '60 m² stüdyo daire planı']
      : mode === 'render'
        ? ['Modern minimalist salon, sıcak ahşap ve doğal ışık', 'Dairenin dış cephesi, akşam ışığı']
        : ['En küçük oda hangisi?', 'Koridor yönetmeliğe uygun mu?', 'Toplam alanım kaç m²?'];

  return (
    <>
      {/* Çiz üretilirken: tuval alanının ALT-ORTASINda dönen daire + "AI plan üretiyor" (tam ortada
          "mal gibi" durmasın — kullanıcı isteği). Panel'in (420px) sağındaki alana, alta hizalı. */}
      {loadingMode === 'draw' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 left-[420px] z-40 hidden items-end justify-center pb-12 sm:flex">
          <div className="flex items-center gap-3 rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-5 py-3 text-sm font-medium text-[var(--text-1)] shadow-2xl">
            <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
            AI plan üretiyor…
          </div>
        </div>
      )}
      <div className="fixed bottom-0 left-0 top-0 z-50 flex w-[420px] max-w-[92vw] flex-col border-r border-[var(--border-soft)] bg-[var(--overlay)] text-[var(--text-1)] shadow-2xl">
      {/* Başlık */}
      <div className="flex items-center gap-2 border-b border-[var(--border-hair)] bg-[var(--surface-2)] px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-white">
          <VesnaLogo className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Vesna</div>
          <div className="text-[11px] text-white/60">Tasarım yardımcın</div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setThread(mode, () => [])}
            className="rounded px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
            title="Bu moddaki sohbeti temizle"
          >
            Temizle
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            abortRef.current?.abort(); // açık istek varsa iptal et (boşa token harcama)
            onClose();
          }}
          className="grid h-7 w-7 place-items-center rounded hover:bg-white/10"
          title="Kapat"
          aria-label="Asistanı kapat"
        >
          ✕
        </button>
      </div>

      {/* Mod seçimi */}
      <div className="flex gap-1 px-3 pt-3">
        {(['ask', 'draw', 'render'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
              mode === m ? 'bg-white/20 font-semibold' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {m === 'ask' ? '💬 Sor' : m === 'draw' ? '✏️ Çiz' : '🖼️ Render'}
            {/* Bu mod meşgulse canlı nokta — başka sekmedeyken bile hangi sohbet çalışıyor belli olsun. */}
            {loadingMode === m && (
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: 'var(--accent-text, #a5a5ff)' }}
                title={`${m === 'ask' ? 'Sor' : m === 'draw' ? 'Çiz' : 'Render'} çalışıyor…`}
              />
            )}
          </button>
        ))}
      </div>

      {/* Mesajlar */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-3"
      >
        {messages.length === 0 && (
          <div className="m-auto max-w-[280px] text-center text-sm text-white/70">
            <VesnaLogo className="mx-auto mb-2 h-8 w-8 text-white/50" />
            {mode === 'draw'
              ? 'Tarif et, planı çizeyim. Örnekler:'
              : mode === 'render'
                ? 'Atmosfer tarif et, görsel üreteyim. Örnekler:'
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
            {mode === 'draw' && (
              <div className="mt-3">
                <ProgramBuilder onApply={(p) => p && setInput(p)} />
              </div>
            )}
          </div>
        )}
        {messages.map((m) => {
          // Akış/daktilo başlamadan önceki boş asistan balonunu gizle (yerine üç-nokta göstergesi çıkar).
          if (m.role === 'assistant' && !m.content && !m.image) return null;
          return (
          <div
            key={m.id}
            className={`msg-in max-w-[90%] rounded-lg px-3 py-2 text-sm ${
              m.role === 'user' ? 'self-end bg-blue-600 text-white' : 'self-start bg-white/10 text-white/95'
            }`}
          >
            <div className="whitespace-pre-wrap leading-relaxed">{renderRich(m.content)}</div>
            {m.image && (
              <>
                <img
                  src={m.image}
                  alt="AI render"
                  className="mt-2 w-full rounded-lg border border-white/10"
                />
                <a
                  href={m.image}
                  download="zynpparti-render.png"
                  className="mt-1 inline-block text-xs text-blue-300 hover:underline"
                >
                  ⤓ Görseli indir
                </a>
              </>
            )}
          </div>
          );
        })}
        {mode === 'draw' && variants && variants.length > 1 && (
          <div className="flex flex-col gap-2 self-stretch">
            {variants.map(({ layout: v, score: s }, i) => (
              <button
                key={`${i}-${v.summary}`}
                type="button"
                onClick={() => drawVariant(v)}
                className="rounded-lg border border-white/15 bg-white/5 p-2 text-left text-sm hover:border-blue-400/60 hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-white/90">Seçenek {i + 1}</span>
                  {s !== null && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        s === 0 ? 'bg-emerald-600/40 text-emerald-100' : 'bg-amber-600/40 text-amber-100'
                      }`}
                    >
                      {s === 0 ? '✓ uyumlu' : `⚠ ${s} uyarı`}
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/60">{v.summary}</div>
                <div className="mt-1 text-[10px] text-white/40">
                  {v.rooms.length} oda · {v.walls.length} duvar · {v.openings.length} kapı/pencere — çizmek için tıkla
                </div>
              </button>
            ))}
          </div>
        )}
        {/* Çiz modunda sohbet göstergesi YOK — üretim tuvalde dönen daireyle gösteriliyor (kullanıcı isteği). */}
        {loadingMode === mode &&
          mode !== 'draw' &&
          (() => {
            const last = messages[messages.length - 1];
            // Daktilo/akış başladıysa (dolu asistan balonu) göstergeyi gizle.
            if (last?.role === 'assistant' && (last.content || last.image)) return null;
            const label = mode === 'render' ? 'Görsel üretiliyor…' : 'Yanıt hazırlanıyor…';
            return <TypingDots label={label} />;
          })()}
      </div>

      {error && (
        <div role="alert" className="mx-3 rounded bg-red-500/15 p-2 text-xs text-red-200">
          {error}
        </div>
      )}

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
            placeholder={
              mode === 'draw'
                ? 'Örn: 90 m² 3+1 daire çiz'
                : mode === 'render'
                  ? 'Örn: sıcak ahşap salon, akşam ışığı'
                  : 'Bir şey sor…'
            }
            className="min-w-0 flex-1 resize-none rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/15"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            {mode === 'draw' ? 'Çiz' : mode === 'render' ? 'Render' : 'Gönder'}
          </button>
        </div>
        <div className="mt-1.5 text-[10px] leading-tight text-white/45">
          {mode === 'draw'
            ? 'AI taslak üretir (deneysel); Ctrl+Z ile geri alınır. Ölçüleri kontrol et.'
            : mode === 'render'
              ? 'AI görsel taslağı (deneysel, yaratıcı mod); planın birebir kopyası değildir.'
              : 'Öneriler bilgilendirme amaçlıdır; yürürlükteki mevzuattan doğrula.'}
        </div>
      </div>
    </div>
    </>
  );
}
