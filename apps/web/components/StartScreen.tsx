'use client';

import { useEffect, useState } from 'react';
import { deserializeModel } from '@zynpparti/document';
import { setProjectName, DEFAULT_PROJECT_NAME } from '@/lib/project-name';
import { setStartEmpty, setPendingOpen } from '@/lib/app-start';
import { setCloudProjectId } from '@/lib/cloud-project';
import { isCloudSignedIn } from '@/lib/cloud-save';
import { listCloudProjects, loadProjectFromCloud, type CloudProject } from '@/lib/supabase/projects';
import { toast } from '@/lib/toast';
import { VesnaLogo } from './VesnaLogo';

/** "3 gün önce" tarzı kısa göreli tarih (bulut liste satırı). Geçersizse boş. */
function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR');
}

/**
 * Açılış/karşılama ekranı: GİRİŞ yapılmışsa önce "Bulut projelerin" listelenir (tıkla → kaldığın
 * yerden devam); ardından "Yeni proje" (isim ver → boş tuval) veya "Aç" (.json model yükle, isim
 * dosyadan türer). Seçim sonrası `onStart()` ile uygulama (CanvasStage) açılır. Proje adı tüm indirme
 * dosya adlarında kullanılır. Collab linki / `?ciz=` ile gelenlerde bu ekran atlanır (AppGate).
 */
export function StartScreen({ onStart }: { onStart: () => void }) {
  const [name, setName] = useState(DEFAULT_PROJECT_NAME);
  const [busy, setBusy] = useState(false);
  // Bulut: null = henüz bilinmiyor (giriş kontrolü sürüyor); [] = giriş var ama proje yok / giriş yok.
  const [cloud, setCloud] = useState<CloudProject[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  // Giriş yapılmışsa bulut projelerini çek → kullanıcı kaldığı yerden devam edebilsin.
  useEffect(() => {
    let active = true;
    void isCloudSignedIn().then((yes) => {
      if (!active) return;
      setSignedIn(yes);
      if (!yes) {
        setCloud([]);
        return;
      }
      listCloudProjects()
        .then((list) => active && setCloud(list))
        .catch(() => active && setCloud([]));
    });
    return () => {
      active = false;
    };
  }, []);

  const createNew = (): void => {
    setProjectName(name.trim() || DEFAULT_PROJECT_NAME);
    setCloudProjectId(undefined); // yeni boş tuval → bulut bağı yok (sonraki Kaydet yeni proje açar)
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
        setCloudProjectId(undefined); // yerel dosya → bulut bağı yok (yanlış üzerine yazma önlemi)
        setPendingOpen(text); // CanvasStage mount'ta yükler
        onStart();
      })
      .catch(() => {
        toast('Dosya okunamadı.', 'error', 4000);
        setBusy(false);
      });
  };

  /** Bulut projesini aç: JSON'u indir → doğrula → adı+bağı kur → CanvasStage mount'ta yükler. */
  const openCloud = (p: CloudProject): void => {
    setBusy(true);
    void loadProjectFromCloud(p.id)
      .then((text) => {
        deserializeModel(text); // doğrula (bozuksa catch'e düşer)
        setProjectName(p.name);
        setCloudProjectId(p.id); // sonraki Kaydet bu projeye üzerine yazar
        setPendingOpen(text);
        onStart();
      })
      .catch(() => {
        toast('Bulut projesi açılamadı.', 'error', 5000);
        setBusy(false);
      });
  };

  const hasCloud = !!cloud && cloud.length > 0;

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

        {hasCloud && (
          <div className="mb-5">
            <p className="mb-1.5 text-sm text-[var(--text-2)]">Bulut projelerin</p>
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {cloud!.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openCloud(p)}
                    title={p.name}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-3)] disabled:opacity-50"
                    style={{ boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
                  >
                    <span className="truncate text-sm text-[var(--text-1)]">{p.name}</span>
                    <span className="shrink-0 text-xs text-[var(--text-2)] opacity-70">
                      {relativeTime(p.updated_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 mb-1 flex items-center gap-2">
              <span className="h-px flex-1 bg-[var(--border-soft)]" />
              <span className="text-xs text-[var(--text-2)] opacity-70">veya yeni başla</span>
              <span className="h-px flex-1 bg-[var(--border-soft)]" />
            </div>
          </div>
        )}

        <label htmlFor="proj-name" className="mb-1.5 block text-sm text-[var(--text-2)]">
          Proje adı
        </label>
        <input
          id="proj-name"
          autoFocus={!hasCloud}
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
              e.target.value = ''; // aynı dosyayı tekrar seçince yeniden tetiklensin (bozuk .json sessiz no-op olmasın)
              if (f) openFile(f);
            }}
          />
        </label>

        {signedIn === false ? (
          <p className="mt-4 text-center text-xs text-[var(--text-2)] opacity-70">
            Projelerini buluta kaydedip her cihazdan sürdürmek için{' '}
            <a href="/giris" className="text-[var(--accent)] hover:underline">
              giriş yap
            </a>
            .
          </p>
        ) : (
          <p className="mt-4 text-center text-xs text-[var(--text-2)] opacity-70">
            Adı sonradan üstteki alandan değiştirebilirsin. İndirilen dosyalar bu adı kullanır.
          </p>
        )}
      </div>
    </main>
  );
}
