'use client';

import { useEffect, useState } from 'react';
import { deserializeModel } from '@zynpparti/document';
import { Cloud, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { setProjectName, DEFAULT_PROJECT_NAME } from '@/lib/project-name';
import { setStartEmpty, setPendingOpen } from '@/lib/app-start';
import { setCloudProjectId } from '@/lib/cloud-project';
import { isCloudSignedIn } from '@/lib/cloud-save';
import {
  listCloudProjects,
  loadProjectFromCloud,
  deleteCloudProject,
  currentUserId,
  type CloudProject,
} from '@/lib/supabase/projects';
import { toast } from '@/lib/toast';
import { confirmDialog } from '@/lib/dialog';
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
 * yerden devam; üzerine gel → sil); ardından "Yeni proje" (isim ver → boş tuval) veya "Aç" (.json model
 * yükle). Seçim sonrası `onStart()` ile uygulama (CanvasStage) açılır. Collab/`?ciz=` ile gelende atlanır.
 */
export function StartScreen({ onStart }: { onStart: () => void }) {
  const [name, setName] = useState(DEFAULT_PROJECT_NAME);
  const [busy, setBusy] = useState(false);
  // Bulut: null = henüz bilinmiyor (giriş kontrolü sürüyor); [] = giriş var ama proje yok / giriş yok.
  const [cloud, setCloud] = useState<CloudProject[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [uid, setUid] = useState<string | null>(null); // paylaşılan/sahip ayrımı (paylaşılanda sil gizli)

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
      void currentUserId().then((id) => active && setUid(id));
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

  /** Bulut projesini sil (onaylı, geri alınamaz) → listeden çıkar. Yalnız sahibi olduğun projelerde. */
  const removeCloud = async (p: CloudProject): Promise<void> => {
    if (!(await confirmDialog(`"${p.name}" buluttan silinsin mi? (Geri alınamaz.)`))) return;
    try {
      await deleteCloudProject(p.id);
      setCloud((list) => (list ?? []).filter((x) => x.id !== p.id));
      toast('Proje silindi.', 'success');
    } catch (err) {
      console.error('Bulut silme hatası:', err);
      toast('Proje silinemedi.', 'error');
    }
  };

  const hasCloud = !!cloud && cloud.length > 0;

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-[var(--bg)] p-6 text-[var(--text-1)]">
      <div
        className="relative w-[27rem] max-w-[92vw] overflow-hidden rounded-[1.75rem] p-7"
        style={{
          background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
          boxShadow:
            '0 28px 70px -20px rgba(0,0,0,0.7), 0 8px 24px -12px rgba(0,0,0,0.5), inset 0 0 0 1px var(--border-soft)',
        }}
      >
        {/* Üstte yumuşak accent parıltısı — premium derinlik (çıktıyı/etkileşimi etkilemez). */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'var(--accent-soft)', opacity: 0.7 }}
        />

        <div className="relative">
          <div className="mb-6 flex items-center gap-2.5">
            <VesnaLogo className="h-8 w-8" />
            <div className="leading-tight">
              <div
                className="text-[1.35rem] font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(90deg, var(--text-1), var(--accent-text))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Vesna
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-3)]">
                Mimari tasarım stüdyosu
              </div>
            </div>
          </div>

          {hasCloud && (
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <Cloud size={14} className="text-[var(--accent-text)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-2)]">
                  Bulut projelerin
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-text)]"
                  style={{ background: 'var(--accent-soft)' }}
                >
                  {cloud!.length}
                </span>
              </div>
              <ul className="-mr-1.5 max-h-60 space-y-1.5 overflow-y-auto pr-1.5">
                {cloud!.map((p) => {
                  const shared = !!p.owner && !!uid && p.owner !== uid;
                  return (
                    <li key={p.id} className="group relative">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openCloud(p)}
                        title={p.name}
                        className="flex w-full items-center gap-3 rounded-xl py-2.5 pl-2.5 pr-11 text-left transition-all duration-150 hover:bg-[var(--surface-3)] disabled:opacity-50"
                        style={{ boxShadow: 'inset 0 0 0 1px var(--border-hair)' }}
                      >
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors group-hover:brightness-110"
                          style={{ background: 'var(--accent-soft)' }}
                        >
                          <FileText size={17} className="text-[var(--accent-text)]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-[var(--text-1)]">{p.name}</span>
                            {shared && (
                              <span
                                className="shrink-0 rounded px-1 text-[10px] text-[var(--accent-text)]"
                                style={{ background: 'var(--accent-soft)' }}
                              >
                                paylaşılan
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-[var(--text-3)]">
                            {relativeTime(p.updated_at)}
                          </span>
                        </span>
                      </button>
                      {/* Sil — yalnız SAHİBİ olduğun projede; üzerine gelince belirir (paylaşılan silinemez). */}
                      {!shared && (
                        <button
                          type="button"
                          onClick={() => void removeCloud(p)}
                          aria-label={`"${p.name}" projesini sil`}
                          title="Sil"
                          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-[var(--text-3)] opacity-0 transition-all hover:bg-red-500/15 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 mb-1 flex items-center gap-3">
                <span className="h-px flex-1 bg-[var(--border-soft)]" />
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-3)]">
                  veya yeni başla
                </span>
                <span className="h-px flex-1 bg-[var(--border-soft)]" />
              </div>
            </div>
          )}

          <label htmlFor="proj-name" className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
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
            className="mb-3.5 w-full rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]"
            style={{ background: 'var(--surface-3)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
          />

          <button
            type="button"
            onClick={createNew}
            disabled={busy}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            style={{
              background: 'linear-gradient(180deg, var(--accent-hover), var(--accent))',
              boxShadow: '0 8px 20px -8px var(--accent), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Plus size={16} /> Yeni proje oluştur
          </button>

          <label
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
            style={{ boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
          >
            <Upload size={15} />
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
            <p className="mt-4 text-center text-xs text-[var(--text-3)]">
              Projelerini buluta kaydedip her cihazdan sürdürmek için{' '}
              <a href="/giris" className="font-medium text-[var(--accent-text)] hover:underline">
                giriş yap
              </a>
              .
            </p>
          ) : (
            <p className="mt-4 text-center text-xs text-[var(--text-3)]">
              Adı sonradan üstteki alandan değiştirebilirsin. İndirilen dosyalar bu adı kullanır.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
