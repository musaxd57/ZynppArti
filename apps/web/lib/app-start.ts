'use client';

/**
 * Karşılama ekranı (StartScreen) ↔ CanvasStage başlangıç köprüsü (modül-store deseni).
 * - "Yeni proje" → `startEmpty=true`: CanvasStage demo tohumunu (seedDemo) ATLAR, boş tuval açar.
 * - "Aç" → `pendingOpen`: açılacak .json metni; CanvasStage mount'ta yükler (bir kez tüketilir).
 * Collab `#room=` / `?ciz=` baypasında ikisi de set EDİLMEZ → eski davranış (seedDemo) korunur.
 */

let _startEmpty = false;
let _pendingOpen: string | null = null;

export function setStartEmpty(v: boolean): void {
  _startEmpty = v;
  if (v) _pendingOpen = null; // "Yeni" ile "Aç" karşılıklı-dışlayan boot niyeti; birini set diğerini iptal eder
}

/** CanvasStage mount'ta okur: true ise demo seed atlanır (boş başla). */
export function isStartEmpty(): boolean {
  return _startEmpty;
}

export function setPendingOpen(text: string | null): void {
  _pendingOpen = text;
  if (text != null) _startEmpty = false; // bir model açılıyor → kalmış "boş başla" niyetini iptal et (footgun)
}

/** Bekleyen açılacak model metnini döndürür ve TÜKETİR (bir kez yüklenir). */
export function consumePendingOpen(): string | null {
  const v = _pendingOpen;
  _pendingOpen = null;
  return v;
}
