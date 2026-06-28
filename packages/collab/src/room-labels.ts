import * as Y from 'yjs';
import { ROOM_TYPE_KEYS } from '@zynpparti/document';
import type { EntityStore, RoomType, Space, StoreChange } from '@zynpparti/document';

/**
 * Mahal-adı senkronu (Faz 3). Mahaller türetilmiş olduğu için entity olarak senkronlanmaz (her client
 * kendi duvarlarından üretir) → kullanıcı verdiği AD/tip kaybolurdu. Bu sınıf, adları geometriden
 * türeyen STABİL bir anahtarla (merkez ~10 cm yuvarlanmış) ayrı bir Y.Map'te paylaşır: aynı duvarlar
 * → aynı merkez → aynı anahtar, dolayısıyla iki client'ta aynı mahale aynı ad uygulanır.
 *
 * Echo-güvenli: yerel yazım origin=this ile, uzak uygulama `applying` bayrağıyla korunur.
 */
export interface RoomLabel {
  readonly name: string;
  readonly roomType?: string;
  readonly material?: string;
}

const MAX_LABEL_LEN = 120;

/**
 * Uzak etiketi DOĞRULA/sanitize et (karantina) — diğer EntitySync gibi, kötü/bozuk peer verisi
 * (devasa string, geçersiz roomType, non-string alanlar) doğrudan store'a (Space.name/roomType) sızmasın.
 * Geçersizse null. roomType yalnız bilinen enum; name/material sınırlı uzunlukta string.
 */
function sanitizeLabel(raw: unknown): RoomLabel | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r['name'] !== 'string') return null;
  const name = r['name'].slice(0, MAX_LABEL_LEN);
  const roomType =
    typeof r['roomType'] === 'string' && ROOM_TYPE_KEYS.has(r['roomType'] as RoomType)
      ? r['roomType']
      : undefined;
  const material =
    typeof r['material'] === 'string' && r['material'].length <= MAX_LABEL_LEN ? r['material'] : undefined;
  return { name, ...(roomType ? { roomType } : {}), ...(material ? { material } : {}) };
}

/** Mahalin merkezinden stabil anahtar (10 cm ızgara) — client'lar arası tutarlı. */
export function roomKey(s: Space): string {
  let x = 0;
  let y = 0;
  for (const p of s.boundary) {
    x += p.x;
    y += p.y;
  }
  const n = s.boundary.length || 1;
  return `${Math.round(x / n / 10)}:${Math.round(y / n / 10)}`;
}

export class RoomLabelSync {
  private readonly ymap: Y.Map<RoomLabel>;
  private applying = false;
  private readonly unsub: () => void;
  private readonly observer: (e: Y.YMapEvent<RoomLabel>, tx: Y.Transaction) => void;

  constructor(
    private readonly store: EntityStore,
    private readonly doc: Y.Doc,
  ) {
    this.ymap = doc.getMap<RoomLabel>('roomLabels');
    if (this.ymap.size > 0) this.applyAll(); // var olan etiketleri mevcut mahallere uygula
    this.unsub = this.store.subscribe((c) => this.onStoreChange(c));
    this.observer = (_e, tx) => {
      if (tx.origin !== this) this.applyAll();
    };
    this.ymap.observe(this.observer);
  }

  private spaces(): Space[] {
    return this.store.byType('space');
  }

  /** Yerel değişiklik: yeni türeyen mahale uzak etiketi uygula; kullanıcı adlandırmasını Y'ye yaz. */
  private onStoreChange(c: StoreChange): void {
    if (this.applying) return;
    // Yeni türeyen mahaller → varsa uzak etiketi uygula (ör. duvar taşındı, mahal yeniden türedi).
    for (const id of c.added) {
      const s = this.store.get(id);
      if (s?.type === 'space') {
        const label = sanitizeLabel(this.ymap.get(roomKey(s)));
        if (label && label.name !== s.name) this.applyLabel(s, label);
      }
    }
    // Kullanıcı bir mahali adlandırdı/tip verdi → Y'ye yaz (varsayılan "Mahal" hariç).
    for (const id of c.updated) {
      const s = this.store.get(id);
      if (s?.type === 'space' && s.name && s.name !== 'Mahal') {
        this.doc.transact(() => {
          this.ymap.set(roomKey(s), {
            name: s.name,
            ...(s.roomType ? { roomType: s.roomType } : {}),
            ...(s.material ? { material: s.material } : {}),
          });
        }, this);
      }
    }
  }

  private applyLabel(s: Space, rawLabel: RoomLabel): void {
    const label = sanitizeLabel(rawLabel); // çağıran sanitize etse de savunma katmanı
    if (!label) return;
    this.applying = true;
    try {
      this.store.put({
        ...s,
        name: label.name,
        ...(label.roomType ? { roomType: label.roomType as RoomType } : {}),
        ...(label.material ? { material: label.material } : {}),
      });
      this.store.emit({ added: [], updated: [s.id], removed: [] });
    } finally {
      this.applying = false;
    }
  }

  /** Tüm etiketleri eşleşen mahallere uygula (ilk açılış + uzak değişiklik). */
  private applyAll(): void {
    this.applying = true;
    try {
      const updated: string[] = [];
      for (const s of this.spaces()) {
        const label = sanitizeLabel(this.ymap.get(roomKey(s)));
        if (label && label.name !== s.name) {
          this.store.put({
            ...s,
            name: label.name,
            ...(label.roomType ? { roomType: label.roomType as RoomType } : {}),
            ...(label.material ? { material: label.material } : {}),
          });
          updated.push(s.id);
        }
      }
      if (updated.length) this.store.emit({ added: [], updated, removed: [] });
    } finally {
      this.applying = false;
    }
  }

  destroy(): void {
    this.unsub();
    this.ymap.unobserve(this.observer);
  }
}
