import type { Vec2 } from '@zynpparti/geometry';

/** Bir araca iletilen, dünya koordinatına çevrilmiş işaretçi (pointer) olayı. */
export interface ScenePointer {
  readonly world: Vec2;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
}

/**
 * Engine'in aktif araca yönlendirdiği etkileşim arayüzü.
 * Araçlar `packages/tools`'ta yaşar; engine yalnız bu arayüzü çağırır (ters bağımlılık yok).
 */
export interface SceneTool {
  onPointerDown?(p: ScenePointer): void;
  onPointerMove?(p: ScenePointer): void;
  onPointerUp?(p: ScenePointer): void;
  onKeyDown?(e: KeyboardEvent): void;
  onActivate?(): void;
  onDeactivate?(): void;
}
