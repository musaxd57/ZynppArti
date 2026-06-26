'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal odak tuzağı (a11y, WCAG 2.4.3): aktifken Tab/Shift+Tab odağı modal İÇİNDE döndürür (arka plandaki
 * tuval/araç çubuğuna kaçmaz) ve kapanınca odağı açan öğeye geri verir. Görünür odaklanabilir öğeleri
 * dinamik bulur. Modal kendi auto-focus'unu yapıyorsa (rAF/autoFocus) onu EZMEZ — odak zaten içerideyse
 * dokunmaz. Container'a `tabIndex={-1}` verirsen hiç odaklanabilir öğe yoksa yedek odak ona düşer.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active = true): void {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const prevFocus = document.activeElement as HTMLElement | null;

    const focusables = (): HTMLElement[] =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);

    // Odak zaten modal içindeyse dokunma (modalin kendi auto-focus'una saygı). Değilse ilk öğeye al.
    if (!el.contains(document.activeElement)) {
      (focusables()[0] ?? el).focus?.();
    }

    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const cur = document.activeElement;
      if (e.shiftKey && (cur === first || cur === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && cur === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [ref, active]);
}
