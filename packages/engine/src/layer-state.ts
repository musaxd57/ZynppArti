/**
 * Katman görünürlük durumu (view-state; doküman verisi DEĞİL → Command'den geçmez, undo dışı).
 * Engine render/culling, araçlar hit-test ve katman paneli aynı örneği paylaşır.
 *
 * Görünürlük "model" değil "görünüm" kararıdır (Zustand UI state mantığı, CLAUDE.md §6.1) → burada
 * tutulur. (İleride katman dosyayla kaydedilecekse doküman tarafına taşınır.)
 */
export class LayerState {
  private readonly hidden = new Set<string>();
  private readonly locked = new Set<string>();
  private readonly listeners = new Set<() => void>();
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
