'use client';

import { useState } from 'react';
import { deserializeModel } from '@zynpparti/document';
import { setProjectName, DEFAULT_PROJECT_NAME } from '@/lib/project-name';
import { setStartEmpty, setPendingOpen } from '@/lib/app-start';
import { toast } from '@/lib/toast';
import { VesnaLogo } from './VesnaLogo';

/**
 * Açılış/karşılama ekranı: "Yeni proje" (isim ver → boş tuval) veya "Aç" (.json model yükle, isim
 * dosyadan türer). Seçim sonrası `onStart()` ile uygulama (CanvasStage) açılır. Proje adı tüm indirme
 * dosya adlarında kullanılır. Collab linki / `?ciz=` ile gelenlerde bu ekran atlanır (AppGate).
 */
export function StartScreen({ onStart }: { onStart: () => void }) {
  const [name, setName] = useState(DEFAULT_PROJECT_NAME);
  const [busy, setBusy] = useState(false);

  const createNew = (): void => {
    setProjectName(name.trim() || DEFAULT_PROJECT_NAME);
    setStartEmpty(true); // demo tohumu atla → boş tuvalle başla
    onStart();
  };

  const openFile = (file: File): void => {
    setBusy(true);
    void file
      .text()
      .then((text) => {
        // Açmadan ÖNCE doğrula — bozuk/yanlış .json sessizce boş açılmasın (uygulama-içi "Aç" gibi uyar).
        try {
          deserializeModel(text);
        } catch {
          toast('Dosya açılamadı — bu uygulamanın .json kayıt biçiminde olmalı.', 'error', 5000);
          setBusy(false);
          return;
        }
        setProjectName(file.name.replace(/\.json$/i, '') || DEFAULT_PROJECT_NAME);
        setPendingOpen(text); // CanvasStage mount'ta yükler
        onStart();
      })
      .catch(() => {
        toast('Dosya okunamadı.', 'error', 4000);
        setBusy(false);
      });
  };

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-[var(--bg)] p-6 text-[var(--text-1)]">
      <div
        className="w-[26rem] max-w-[92vw] rounded-2xl p-7"
        style={{ background: 'var(--surface-2)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
      >
        <div className="mb-5 flex items-center gap-2">
          <VesnaLogo className="h-7 w-7" />
          <span className="text-lg font-semibold">Vesna</span>
        </div>

        <label htmlFor="proj-name" className="mb-1.5 block text-sm text-[var(--text-2)]">
          Proje adı
        </label>
        <input
          id="proj-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') createNew();
          }}
          placeholder="Örn. Ev Planı"
          className="mb-4 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ background: 'var(--surface-3)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
        />

        <button
          type="button"
          onClick={createNew}
          disabled={busy}
          className="mb-2 w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          Yeni proje oluştur
        </button>

        <label className="block w-full cursor-pointer rounded-lg px-4 py-2.5 text-center text-sm transition-colors hover:bg-[var(--surface-3)]" style={{ boxShadow: 'inset 0 0 0 1px var(--border-soft)', color: 'var(--text-2)' }}>
          {busy ? 'Açılıyor…' : 'Kayıtlı proje aç (.json)'}
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) openFile(f);
            }}
          />
        </label>

        <p className="mt-4 text-center text-xs text-[var(--text-2)] opacity-70">
          Adı sonradan üstteki alandan değiştirebilirsin. İndirilen dosyalar bu adı kullanır.
        </p>
      </div>
    </main>
  );
}
