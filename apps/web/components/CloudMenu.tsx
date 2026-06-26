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
    supabase.auth.getUser().then(({ data }) => active && setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session?.user));
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
        <div className="absolute left-0 top-full z-40 mt-1 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2 shadow-lg">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="mb-1 w-full rounded-md bg-[var(--accent)] px-3 py-1.5 text-left text-sm font-medium text-white hover:bg-[var(--accent-2)] disabled:opacity-50"
          >
            {currentId ? 'Buluta kaydet (üzerine yaz)' : 'Buluta kaydet'}
          </button>

          <div className="mt-2 mb-1 px-1 text-xs text-[var(--text-3)]">Bulut projelerim</div>
          {busy && projects === null ? (
            <p className="px-1 py-2 text-sm text-[var(--text-3)]">Yükleniyor…</p>
          ) : projects && projects.length > 0 ? (
            <ul className="max-h-60 space-y-0.5 overflow-y-auto">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void openProject(p)}
                    className="flex-1 truncate rounded px-2 py-1.5 text-left text-sm text-[var(--text-1)] hover:bg-[var(--surface-3)] disabled:opacity-50"
                    title={p.name}
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(p)}
                    className="rounded px-1.5 py-1 text-xs text-[var(--text-3)] hover:text-red-400"
                    title="Sil"
                    aria-label={`"${p.name}" sil`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-1 py-2 text-sm text-[var(--text-3)]">Henüz bulut projen yok.</p>
          )}
        </div>
      )}
    </div>
  );
}
