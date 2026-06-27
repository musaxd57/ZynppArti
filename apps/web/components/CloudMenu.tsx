'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BatchCommand,
  replaceEntitiesCommands,
  serializeModel,
  deserializeModel,
  type EntityStore,
  type History,
} from '@zynpparti/document';
import { Cloud } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import {
  saveProjectToCloud,
  listCloudProjects,
  loadProjectFromCloud,
  deleteCloudProject,
  type CloudProject,
} from '@/lib/supabase/projects';
import { useProjectName, setProjectName } from '@/lib/project-name';
import { useCloudProjectId, setCloudProjectId } from '@/lib/cloud-project';
import { toast } from '@/lib/toast';
import { confirmDialog } from '@/lib/dialog';
import { ShareDialog } from './ShareDialog';

/** "3 gün önce" tarzı göreli tarih (yorum/proje listesi). Geçersizse boş. */
function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR');
}

/**
 * Bulut Kaydet/Aç menüsü (ADR-0047). Yalnız Supabase yapılandırılmış + GİRİŞ yapılmışken görünür
 * (anonim akış bozulmaz). Model `serializeModel` zarfıyla Storage'a yazılır → yerel .json ile uyumlu.
 */
export function CloudMenu({
  store,
  history,
  zoomToFit,
}: {
  store: EntityStore;
  history: History;
  zoomToFit?: () => void;
}): React.ReactElement | null {
  const projectName = useProjectName();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState<CloudProject[] | null>(null);
  const [query, setQuery] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<CloudProject | null>(null);
  // Açık bulut projesinin id'si → tekrar "Kaydet" üzerine yazar. PAYLAŞILAN store: "Yeni"/yerel "Aç"
  // doküman değiştirince sıfırlanır → ilgisiz çizimi yanlış projeye yazma önlenir (denetim bulgusu).
  const currentId = useCloudProjectId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setSignedIn(false);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setSignedIn(!!data.user);
      setUid(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
      setUid(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Dışarı tıkla → kapat.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Marketing menüsünden "Bulut projelerim" (?bulut=1) ile gelince menüyü otomatik aç + listeyi tazele.
  useEffect(() => {
    if (signedIn !== true) return;
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('bulut') !== '1') return;
    setOpen(true);
    void refreshList();
    // Paramı temizle ki yenilemede tekrar açılmasın.
    const url = new URL(window.location.href);
    url.searchParams.delete('bulut');
    window.history.replaceState({}, '', url.toString());
  }, [signedIn]);

  if (!signedIn) return null; // anahtar yok ya da giriş yok → gizli (anonim akış)

  async function save(): Promise<void> {
    setBusy(true);
    try {
      const { id } = await saveProjectToCloud({ id: currentId, name: projectName, json: serializeModel(store.all()) });
      setCloudProjectId(id);
      setProjects(null); // liste bayatladı
      toast('Buluta kaydedildi.', 'success');
      setOpen(false);
    } catch (err) {
      console.error('Bulut kaydetme hatası:', err);
      toast(err instanceof Error ? err.message : 'Buluta kaydedilemedi.', 'error', 5000);
    } finally {
      setBusy(false);
    }
  }

  /** Farklı kaydet — currentId yok sayılır, her zaman YENİ bulut projesi oluşturur. */
  async function saveAsNew(): Promise<void> {
    setBusy(true);
    try {
      const { id } = await saveProjectToCloud({ name: projectName, json: serializeModel(store.all()) });
      setCloudProjectId(id);
      setProjects(null);
      toast('Yeni bulut projesi oluşturuldu.', 'success');
      setOpen(false);
    } catch (err) {
      console.error('Bulut farklı-kaydet hatası:', err);
      toast(err instanceof Error ? err.message : 'Kaydedilemedi.', 'error', 5000);
    } finally {
      setBusy(false);
    }
  }

  async function refreshList(): Promise<void> {
    setBusy(true);
    try {
      setProjects(await listCloudProjects());
    } catch (err) {
      console.error('Bulut liste hatası:', err);
      toast('Bulut projeleri alınamadı.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function openProject(p: CloudProject): Promise<void> {
    setBusy(true);
    try {
      const loaded = deserializeModel(await loadProjectFromCloud(p.id));
      const toAdd = loaded.filter((ent) => ent.type !== 'space'); // mahaller türetilir
      // Ortak id'ler Update (Remove+Add DEĞİL) → BatchCommand tek-id kuralına takılmaz (denetim bulgusu).
      const cmds = replaceEntitiesCommands(store.all().filter((ent) => ent.type !== 'space'), toAdd);
      if (cmds.length > 0) {
        history.dispatch(cmds.length === 1 ? cmds[0]! : new BatchCommand('Buluttan aç', cmds));
      }
      zoomToFit?.(); // açılan bulut projesini KADRAJA al (origin'den uzak/büyük model boş-görünmesin)
      setProjectName(p.name);
      setCloudProjectId(p.id);
      toast(`"${p.name}" açıldı (${toAdd.length} öğe).`, 'success');
      setOpen(false);
    } catch (err) {
      console.error('Bulut açma hatası:', err);
      toast('Proje açılamadı.', 'error', 5000);
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: CloudProject): Promise<void> {
    if (!(await confirmDialog(`"${p.name}" buluttan silinsin mi? (Geri alınamaz.)`))) return;
    try {
      await deleteCloudProject(p.id);
      setProjects((list) => (list ?? []).filter((x) => x.id !== p.id));
      if (currentId === p.id) setCloudProjectId(undefined);
      toast('Proje silindi.', 'success');
    } catch (err) {
      console.error('Bulut silme hatası:', err);
      toast('Proje silinemedi.', 'error');
    }
  }

  const btn =
    'shrink-0 rounded-md px-3 py-1.5 text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`${btn} flex items-center gap-1.5`}
        title="Bulut (Kaydet/Aç)"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && projects === null) void refreshList();
        }}
      >
        <Cloud size={15} /> Bulut
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-72 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2 shadow-lg">
          <div className="mb-1 flex gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void save()}
              className="flex-1 rounded-md bg-[var(--accent)] px-3 py-1.5 text-left text-sm font-medium text-white hover:bg-[var(--accent-2)] disabled:opacity-50"
            >
              {currentId ? 'Kaydet (üzerine yaz)' : 'Buluta kaydet'}
            </button>
            {currentId && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveAsNew()}
                title="Farklı kaydet (yeni proje)"
                className="shrink-0 rounded-md border border-[var(--border)] px-2 py-1.5 text-sm text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] disabled:opacity-50"
              >
                Farklı
              </button>
            )}
          </div>

          <div className="mt-2 mb-1 flex items-center justify-between px-1">
            <span className="text-xs text-[var(--text-3)]">Bulut projelerim</span>
            {projects && projects.length > 4 && (
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ara…"
                className="w-24 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-xs text-[var(--text-1)] outline-none focus:border-[var(--accent)]"
              />
            )}
          </div>

          {busy && projects === null ? (
            <p className="px-1 py-2 text-sm text-[var(--text-3)]">Yükleniyor…</p>
          ) : (() => {
              const q = query.trim().toLowerCase();
              const list = (projects ?? []).filter((p) => !q || p.name.toLowerCase().includes(q));
              if (!projects || projects.length === 0)
                return <p className="px-1 py-2 text-sm text-[var(--text-3)]">Henüz bulut projen yok.</p>;
              if (list.length === 0)
                return <p className="px-1 py-2 text-sm text-[var(--text-3)]">Eşleşen proje yok.</p>;
              return (
                <ul className="max-h-64 space-y-0.5 overflow-y-auto">
                  {list.map((p) => {
                    const shared = !!p.owner && !!uid && p.owner !== uid;
                    return (
                      <li key={p.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void openProject(p)}
                          className="min-w-0 flex-1 rounded px-2 py-1.5 text-left hover:bg-[var(--surface-3)] disabled:opacity-50"
                          title={p.name}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm text-[var(--text-1)]">{p.name}</span>
                            {shared && (
                              <span className="shrink-0 rounded bg-[var(--accent-soft)] px-1 text-[10px] text-[var(--accent-text)]">
                                paylaşılan
                              </span>
                            )}
                          </span>
                          <span className="block text-[10px] text-[var(--text-3)]">{relativeTime(p.updated_at)}</span>
                        </button>
                        {!shared && (
                          <button
                            type="button"
                            onClick={() => setShareTarget(p)}
                            className="shrink-0 rounded px-1.5 py-1 text-xs text-[var(--text-3)] hover:text-[var(--accent)]"
                            title="Paylaş"
                            aria-label={`"${p.name}" paylaş`}
                          >
                            Paylaş
                          </button>
                        )}
                        {!shared && (
                          <button
                            type="button"
                            onClick={() => void remove(p)}
                            className="shrink-0 rounded px-1.5 py-1 text-xs text-[var(--text-3)] hover:text-red-400"
                            title="Sil"
                            aria-label={`"${p.name}" sil`}
                          >
                            ✕
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
        </div>
      )}

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
