'use client';

import { useSyncExternalStore } from 'react';

/**
 * Tek proje adı — `toast.ts`/`dialog.ts` ile aynı modül-store deseni (React dışından da okunur/yazılır).
 * İndirme dosya adları bundan türer (ör. "Ev Planı" → "Ev Planı.png", "Ev Planı-metraj.xlsx").
 *
 * NOT: `zynpparti.*` localStorage anahtarları (dock genişliği, katman sırası…) AYRI iç-depolamadır,
 * bunlarla karışmaz. Burada yalnız `zynpparti.projectName` kullanılır (iç anahtar — değişmez).
 */

const STORAGE_KEY = 'zynpparti.projectName';
/** Adsız projenin tek varsayılan adı — StartScreen + Toolbar açma yedeği hep bunu kullanır (tutarlı). */
export const DEFAULT_PROJECT_NAME = 'Adsız Plan';
const DEFAULT_NAME = DEFAULT_PROJECT_NAME;

let name = DEFAULT_NAME;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

/** İlk yüklemede localStorage'tan oku (SSR güvenli). CanvasStage mount'unda bir kez çağrılır. */
export function loadProjectName(): void {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && v.trim()) name = v;
  } catch {
    /* localStorage yoksa yoksay */
  }
}

export function getProjectName(): string {
  return name;
}

/** Proje adını ayarlar (ham metin — boşluk/Türkçe serbest). Persist eder + dinleyicileri uyarır. */
export function setProjectName(next: string): void {
  name = next;
  emit();
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    /* yoksay */
  }
}

export function subscribeProjectName(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Dosya adı için güvenli taban (uzantısız). Yol ayraçları + Windows'ta yasak karakterleri (/ \ : * ? " < > |)
 * ve kontrol karakterlerini kaldırır; baş/son nokta-boşluğu kırpar; boşsa "plan"a düşer. Türkçe karakter korunur.
 * Çağıran uzantıyı ekler: `${base}.png`.
 */
export function sanitizeFilename(raw: string): string {
  const cleaned = raw
    .replace(/[/\\:*?"<>|]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .replace(/[.\s]+$/, '');
  return cleaned.length > 0 ? cleaned.slice(0, 80) : 'plan';
}

/** İndirme için güvenli dosya tabanı (mevcut proje adından). İmperatif indirme handler'ları bunu çağırır. */
export function projectFileBase(): string {
  return sanitizeFilename(getProjectName());
}

/** Ham proje adı (düzenlenebilir alanın `value`'su için) — değişince yeniden render. */
export function useProjectName(): string {
  return useSyncExternalStore(subscribeProjectName, getProjectName, () => DEFAULT_NAME);
}

/** Güvenli dosya tabanı (render-zamanı kullanan JSX için, ör. <a download=...>). */
export function useProjectFileBase(): string {
  return sanitizeFilename(useProjectName());
}
