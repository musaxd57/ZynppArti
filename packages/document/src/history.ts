import type { Command } from './command';
import type { EntityStore } from './store';

/**
 * Undo/redo yığını. Modeli değiştiren TEK giriş noktası `dispatch`'tir (CLAUDE.md §6.3).
 *
 * Her dispatch'te komutun tersi (güncel durumdan) yakalanıp undo yığınına konur ve redo temizlenir.
 * undo/redo, yakalanmış ters komutu uygular ve karşı yığına yeni tersini iter — bu yüzden tekrar
 * tekrar undo↔redo tutarlı kalır.
 */
export class History {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];

  constructor(private readonly store: EntityStore) {}

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * invert (apply ÖNCESİ, SAF — store'u değiştirmez) + apply'ı tek try'da çalıştırır. invert hedef entity
   * yokken throw eder (ör. uzak peer onu sildi — CLAUDE §6.4 köşe durumu); o zaman apply HİÇ çalışmaz
   * (store değişmez, zombie diriltilmez) → adımı güvenle atla. Aksi halde yakalanmamış throw, undo
   * yığınını yarı-değiştirip BOZARDI (denetim HIGH). null = adım yapılamadı.
   */
  private run(command: Command): { inverse: Command; change: ReturnType<Command['apply']> } | null {
    try {
      const inverse = command.invert(this.store);
      const change = command.apply(this.store);
      return { inverse, change };
    } catch (e) {
      console.error('Komut uygulanamadı (hedef entity yok — büyük olasılıkla uzak peer sildi); atlandı:', e);
      return null;
    }
  }

  /** Bir komutu uygula, undo'ya kaydet, redo'yu temizle, değişikliği yayınla. */
  dispatch(command: Command): void {
    const res = this.run(command);
    if (!res) return; // hedef yok → no-op (stack'e dokunma)
    this.undoStack.push(res.inverse);
    this.redoStack.length = 0;
    this.store.emit(res.change);
  }

  undo(): void {
    const command = this.undoStack[this.undoStack.length - 1];
    if (!command) return;
    const res = this.run(command);
    // Başarısızsa bozuk girdiyi at (hedefi yok → terslenemez), stack tutarlı kalsın.
    this.undoStack.pop();
    if (!res) return;
    this.redoStack.push(res.inverse);
    this.store.emit(res.change);
  }

  redo(): void {
    const command = this.redoStack[this.redoStack.length - 1];
    if (!command) return;
    const res = this.run(command);
    this.redoStack.pop();
    if (!res) return;
    this.undoStack.push(res.inverse);
    this.store.emit(res.change);
  }
}
