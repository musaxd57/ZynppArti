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

  /** Bir komutu uygula, undo'ya kaydet, redo'yu temizle, değişikliği yayınla. */
  dispatch(command: Command): void {
    const inverse = command.invert(this.store);
    const change = command.apply(this.store);
    this.undoStack.push(inverse);
    this.redoStack.length = 0;
    this.store.emit(change);
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;
    const inverse = command.invert(this.store);
    const change = command.apply(this.store);
    this.redoStack.push(inverse);
    this.store.emit(change);
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    const inverse = command.invert(this.store);
    const change = command.apply(this.store);
    this.undoStack.push(inverse);
    this.store.emit(change);
  }
}
