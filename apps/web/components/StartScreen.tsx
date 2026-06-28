'use client';

import { useEffect, useState } from 'react';
import { deserializeModel } from '@zynpparti/document';
import { exportSvg } from '@zynpparti/io';
import { Cloud, FolderOpen, Plus, Share2, Trash2, Upload } from 'lucide-react';
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
import { ShareDialog } from './ShareDialog';

/** "3 gün önce" tarzı kısa göreli tarih (proje kartı). Geçersizse boş. */
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
 * Bir bulut projesinin CANLI vektör önizlemesi (thumbnail). Projenin JSON'unu indirir → `exportSvg`
 * ile çizer → data-URL <img>. Mahaller türetilmiş olduğundan dahil edilmez (kaydedilmiş space'ler
 * dolgu için kalsın → renkli önizleme). Lazy: kart mount olunca yüklenir; yüklenirken iskelet.
 */
function CloudThumbnail({ id }: { id: string }): React.ReactElement {
  const [state, setState] = useState<{ kind: 'loading' } | { kind: 'ok'; url: string } | { kind: 'empty' | 'error' }>(
    { kind: 'loading' },
  );

  useEffect(() => {
    let active = true;
    void loadProjectFromCloud(id)
      .then((text) => {
        if (!active) return;
        const ents = deserializeModel(text);
        if (ents.length === 0) {
          setState({ kind: 'empty' });
          return;
        }
        const svg = exportSvg(ents);
        setState({ kind: 'ok', url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` });
      })
      .catch(() => active && setState({ kind: 'error' }));
    return () => {
      active = false;
    };
  }, [id]);

  if (state.kind === 'ok') {
    return <img src={state.url} alt="" className="h-full w-full object-contain p-2" />;
  }
  if (state.kind === 'loading') {
    return <div className="h-full w-full animate-pulse" style={{ background: 'var(--surface-3)' }} />;
  }
  return (
    <div className="grid h-full w-full place-items-center text-xs text-[var(--text-3)]">
      {state.kind === 'empty' ? 'boş plan' : 'önizleme yok'}
    </div>
  );
}

/**
 * Açılış ekranı — TAM EKRAN proje galerisi. GİRİŞ yapılmışsa bulut projeleri ızgara halinde, her biri
 * canlı önizleme (thumbnail) + ad + tarih + sil ile; tıkla → kaldığın yerden devam. Üstte yeni proje
 * oluştur / .json aç. Giriş yoksa anonim akış (yeni/aç) + giriş daveti. Collab/`?ciz=` ile gelende
 * AppGate bu ekranı atlar. `onStart()` ile CanvasStage'e geçilir.
 */
export function StartScreen({ onStart }: { onStart: () => void }) {
  const [name, setName] = useState(DEFAULT_PROJECT_NAME);
  const [busy, setBusy] = useState(false);
  const [cloud, setCloud] = useState<CloudProject[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<CloudProject | null>(null); // Paylaş modalı (sahip-only)

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
    setCloudProjectId(undefined); // yeni boş tuval → bulut bağı yok
    setStartEmpty(true);
    onStart();
  };

  const openFile = (file: File): void => {
    setBusy(true);
    void file
      .text()
      .then((text) => {
        try {
          deserializeModel(text); // açmadan ÖNCE doğrula (bozuk .json sessizce boş açılmasın)
        } catch {
          toast('Dosya açılamadı — bu uygulamanın .json kayıt biçiminde olmalı.', 'error', 5000);
          setBusy(false);
          return;
        }
        setProjectName(file.name.replace(/\.json$/i, '') || DEFAULT_PROJECT_NAME);
        setCloudProjectId(undefined);
        setPendingOpen(text);
        onStart();
      })
      .catch(() => {
        toast('Dosya okunamadı.', 'error', 4000);
        setBusy(false);
      });
  };

  const openCloud = (p: CloudProject): void => {
    setBusy(true);
    void loadProjectFromCloud(p.id)
      .then((text) => {
        deserializeModel(text); // doğrula
        setProjectName(p.name);
        setCloudProjectId(p.id); // sonraki Kaydet bu projeye yazar
        setPendingOpen(text);
        onStart();
      })
      .catch(() => {
        toast('Bulut projesi açılamadı.', 'error', 5000);
        setBusy(false);
      });
  };

  /** Bulut projesini sil (onaylı, geri alınamaz). Yalnız sahibi olduğun projelerde. */
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
  const loadingCloud = signedIn === true && cloud === null;

  // Yeni proje kartı (ızgaranın ilk hücresi) — üstteki ad alanını kullanır.
  const newCard = (
    <button
      type="button"
      onClick={createNew}
      disabled={busy}
      className="group grid aspect-[4/3] w-full place-items-center rounded-2xl border-2 border-dashed transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] disabled:opacity-50"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <span className="flex flex-col items-center gap-2 text-[var(--text-2)] transition-colors group-hover:text-[var(--accent-text)]">
        <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: 'var(--accent-soft)' }}>
          <Plus size={24} className="text-[var(--accent-text)]" />
        </span>
        <span className="text-sm font-semibold">Yeni proje</span>
      </span>
    </button>
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg)] text-[var(--text-1)]">
      {/* Üst bar: marka + yeni proje adı + oluştur/aç */}
      <header
        className="sticky top-0 z-10 flex flex-wrap items-center gap-3 px-5 py-3.5 backdrop-blur-xl sm:px-8"
        style={{ background: 'color-mix(in srgb, var(--bg) 78%, transparent)', boxShadow: '0 1px 0 var(--border-soft)' }}
      >
        <div className="mr-auto flex items-center gap-2.5">
          <VesnaLogo className="h-8 w-8" />
          <div className="leading-tight">
            <div
              className="text-lg font-bold tracking-tight"
              style={{
                background: 'linear-gradient(90deg, var(--text-1), var(--accent-text))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Vesna
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-3)]">
              Mimari tasarım stüdyosu
            </div>
          </div>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') createNew();
          }}
          placeholder="Proje adı"
          aria-label="Yeni proje adı"
          className="h-10 w-40 rounded-xl px-3 text-sm text-[var(--text-1)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] sm:w-52"
          style={{ background: 'var(--surface-3)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
        />
        <button
          type="button"
          onClick={createNew}
          disabled={busy}
          className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          style={{
            background: 'linear-gradient(180deg, var(--accent-hover), var(--accent))',
            boxShadow: '0 8px 20px -10px var(--accent), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <Plus size={16} /> <span className="hidden sm:inline">Yeni proje</span>
        </button>
        <label
          className="flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-sm font-medium text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
          style={{ boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
          title="Kayıtlı .json proje aç"
        >
          <Upload size={15} />
          <span className="hidden sm:inline">{busy ? 'Açılıyor…' : 'Aç (.json)'}</span>
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) openFile(f);
            }}
          />
        </label>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8">
        {/* GİRİŞ YOK → anonim davet */}
        {signedIn === false && (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl" style={{ background: 'var(--accent-soft)' }}>
              <Cloud size={26} className="text-[var(--accent-text)]" />
            </div>
            <h1 className="mb-2 text-xl font-bold">Hemen çizmeye başla</h1>
            <p className="mb-6 text-sm text-[var(--text-2)]">
              Üstten yeni proje oluştur ya da bir <code>.json</code> aç. Projelerini buluta kaydedip her cihazdan
              sürdürmek için{' '}
              <a href="/giris" className="font-medium text-[var(--accent-text)] hover:underline">
                giriş yap
              </a>
              .
            </p>
          </div>
        )}

        {/* GİRİŞ VAR → bulut galerisi */}
        {signedIn === true && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen size={18} className="text-[var(--accent-text)]" />
              <h1 className="text-base font-bold">Projelerin</h1>
              {hasCloud && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-text)]"
                  style={{ background: 'var(--accent-soft)' }}
                >
                  {cloud!.length}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {newCard}

              {loadingCloud &&
                [0, 1, 2].map((i) => (
                  <div
                    key={`sk${i}`}
                    className="aspect-[4/3] w-full animate-pulse rounded-2xl"
                    style={{ background: 'var(--surface-2)' }}
                  />
                ))}

              {hasCloud &&
                cloud!.map((p) => {
                  const shared = !!p.owner && !!uid && p.owner !== uid;
                  return (
                    <div
                      key={p.id}
                      className="group relative overflow-hidden rounded-2xl transition-all duration-150 hover:-translate-y-0.5"
                      style={{ background: 'var(--surface-2)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
                    >
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openCloud(p)}
                        title={p.name}
                        className="block w-full text-left disabled:opacity-50"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-white">
                          <CloudThumbnail id={p.id} />
                        </div>
                        <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-[var(--text-1)]">{p.name}</span>
                              {shared && (
                                <span
                                  className="shrink-0 rounded px-1 text-[10px] text-[var(--accent-text)]"
                                  style={{ background: 'var(--accent-soft)' }}
                                >
                                  paylaşılan
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{relativeTime(p.updated_at)}</div>
                          </div>
                        </div>
                      </button>
                      {/* Paylaş + Sil — thumbnail sağ-üstünde, üzerine gelince belirir (yalnız SAHİBİ olduğun projede). */}
                      {!shared && (
                        <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setShareTarget(p)}
                            aria-label={`"${p.name}" projesini paylaş`}
                            title="Paylaş"
                            className="grid h-8 w-8 place-items-center rounded-lg bg-black/45 text-white/90 backdrop-blur transition-all hover:bg-[var(--accent)]"
                          >
                            <Share2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeCloud(p)}
                            aria-label={`"${p.name}" projesini sil`}
                            title="Sil"
                            className="grid h-8 w-8 place-items-center rounded-lg bg-black/45 text-white/90 backdrop-blur transition-all hover:bg-red-500/80"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {signedIn === true && !loadingCloud && !hasCloud && (
              <p className="mt-6 text-sm text-[var(--text-3)]">
                Henüz bulut projen yok — üstten ilk projeni oluştur, sonra <b>Ctrl+S</b> ile buluta kaydet.
              </p>
            )}
          </>
        )}

        {signedIn === null && (
          <div className="grid place-items-center py-24 text-sm text-[var(--text-3)]">Yükleniyor…</div>
        )}
      </div>

      {shareTarget && (
        <ShareDialog
          projectId={shareTarget.id}
          projectName={shareTarget.name}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  );
}
