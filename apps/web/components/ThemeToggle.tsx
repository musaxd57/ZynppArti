'use client';

import { useEffect, useState } from 'react';

/**
 * Açık/koyu tema değiştirici (güneş/ay). `data-theme`'i <html>'e yazar + localStorage'da saklar.
 * ThemeScript boyamadan önce başlangıç temasını kurar; bu buton çalışma anında değiştirir.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark((document.documentElement.dataset.theme ?? 'dark') !== 'light');
  }, []);

  const toggle = (): void => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('vesna-theme', next);
    } catch {
      /* yoksay */
    }
    setDark(!dark);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Temayı değiştir"
      className="v-icon-btn"
      style={{
        width: 38,
        height: 38,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        cursor: 'pointer',
      }}
    >
      {dark ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
