/**
 * Varsayılan katman z-sırası (ön→arka; panelde üstten alta). Açıkça sıralanmamış katmanlar bu
 * sıraya, o da yoksa alfabetik sona düşer. Hibrit z (ADR-0040): oda dolguları her zaman EN ALTTA,
 * metin/etiketler her zaman EN ÜSTTE; bu sıra yalnız **orta bandı** (duvar/boşluk/blok/parsel/ölçü/
 * kesit çizgileri) etkiler → reorder anlamlı ama "dolgu duvarı örttü / etiket kayboldu" olmaz.
 */
export const DEFAULT_LAYER_ORDER: readonly string[] = [
  'annotation',
  'section',
  'default',
  'furniture',
  'rooms',
  'site',
  'sheet',
];

/**
 * Katman görünürlük + z-sırası durumu (view-state; doküman verisi DEĞİL → Command'den geçmez,
 * undo dışı). Engine render/culling, araçlar hit-test ve katman paneli aynı örneği paylaşır.
 *
 * Görünürlük/sıra "model" değil "görünüm" kararıdır (Zustand UI state mantığı, CLAUDE.md §6.1) →
 * burada tutulur. (İleride katman dosyayla kaydedilecekse doküman tarafına taşınır. İç içe katman
 * hiyerarşisi Faz 3'e ertelendi — döngü invariant'ları collab/backend'de garanti edilir, §6.4.)
 */
export class LayerState {
  private readonly hidden = new Set<string>();
  private readonly locked = new Set<string>();
  private readonly listeners = new Set<() => void>();
  /** Kullanıcının açık z-sırası (ön→arka). Boşsa DEFAULT_LAYER_ORDER + alfabetik kullanılır. */
  private order: string[] = [];
  /** Solo edilmiş katman (yalnız o görünür); yoksa null. */
  private soloLayerId: string | null = null;

  isHidden(layerId: string): boolean {
    return this.hidden.has(layerId);
  }

  setHidden(layerId: string, hidden: boolean): void {
    if (hidden) this.hidden.add(layerId);
    else this.hidden.delete(layerId);
    this.soloLayerId = null; // elle görünürlük değişimi solo'yu bozar
    this.emit();
  }

  isSolo(layerId: string): boolean {
    return this.soloLayerId === layerId;
  }

  /**
   * "Yalnız bunu göster" (solo): verilen katman dışındakileri gizler. Aynı katman zaten solo ise
   * çözer (hepsini gösterir). Figma/Photoshop deseni. `allLayerIds` = mevcut tüm katmanlar.
   */
  solo(layerId: string, allLayerIds: readonly string[]): void {
    if (this.soloLayerId === layerId) {
      for (const id of allLayerIds) this.hidden.delete(id);
      this.soloLayerId = null;
    } else {
      for (const id of allLayerIds) {
        if (id === layerId) this.hidden.delete(id);
        else this.hidden.add(id);
      }
      this.soloLayerId = layerId;
    }
    this.emit();
  }

  toggle(layerId: string): void {
    this.setHidden(layerId, !this.isHidden(layerId));
  }

  /** Kilitli katman seçilemez/silinemez/taşınamaz (hit-test atlar); görünür kalır. */
  isLocked(layerId: string): boolean {
    return this.locked.has(layerId);
  }

  setLocked(layerId: string, locked: boolean): void {
    if (locked) this.locked.add(layerId);
    else this.locked.delete(layerId);
    this.emit();
  }

  toggleLock(layerId: string): void {
    this.setLocked(layerId, !this.isLocked(layerId));
  }

  /** Açık z-sırasını döndürür (ön→arka); panel/persist bunu okur. */
  getOrder(): readonly string[] {
    return this.order;
  }

  /** Açık z-sırasını ayarlar (ön→arka). Panel sürükle-sırala + localStorage geri-yükleme buradan. */
  setOrder(ids: readonly string[]): void {
    this.order = [...ids];
    this.emit();
  }

  /**
   * Verilen (mevcut) katmanları z-sırasına göre **ön→arka** sıralar: önce açık `order`, yoksa
   * DEFAULT_LAYER_ORDER, o da yoksa alfabetik. Panel görüntüsü ve render orta-bant sırası bunu kullanır.
   */
  sortLayers(present: readonly string[]): string[] {
    const rank = (id: string): number => {
      const e = this.order.indexOf(id);
      if (e >= 0) return e;
      const d = DEFAULT_LAYER_ORDER.indexOf(id);
      return d >= 0 ? 1000 + d : 2000;
    };
    return [...present].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }
}
