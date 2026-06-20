/**
 * Katman görünürlük durumu (view-state; doküman verisi DEĞİL → Command'den geçmez, undo dışı).
 * Engine render/culling, araçlar hit-test ve katman paneli aynı örneği paylaşır.
 *
 * Görünürlük "model" değil "görünüm" kararıdır (Zustand UI state mantığı, CLAUDE.md §6.1) → burada
 * tutulur. (İleride katman dosyayla kaydedilecekse doküman tarafına taşınır.)
 */
export class LayerState {
  private readonly hidden = new Set<string>();
  private readonly listeners = new Set<() => void>();

  isHidden(layerId: string): boolean {
    return this.hidden.has(layerId);
  }

  setHidden(layerId: string, hidden: boolean): void {
    if (hidden) this.hidden.add(layerId);
    else this.hidden.delete(layerId);
    this.emit();
  }

  toggle(layerId: string): void {
    this.setHidden(layerId, !this.isHidden(layerId));
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
