'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  shareProject,
  listProjectMembers,
  removeProjectMember,
  type ProjectMember,
} from '@/lib/supabase/projects';
import { toast } from '@/lib/toast';

const ROLES: { value: string; label: string }[] = [
  { value: 'viewer', label: 'Görüntüleyici' },
  { value: 'commenter', label: 'Yorumcu' },
  { value: 'editor', label: 'Düzenleyici' },
];

/**
 * Proje paylaşım modalı (ADR-0047). Yalnız proje SAHİBİ için anlamlı (RPC sahip kontrolü yapar).
 * E-posta + rol ile üye ekler; mevcut üyeleri listeler/çıkarır. uid çözümü sunucuda (definer RPC).
 */
export function ShareDialog({
  projectId,
  projectName,
  onClose,
}: {
  projectId: string;
  projectName: string;
  onClose: () => void;
}): React.ReactElement {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<ProjectMember[] | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    void refresh();
  }, [projectId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function refresh(): Promise<void> {
    try {
      setMembers(await listProjectMembers(projectId));
    } catch (err) {
      console.error('Üye listesi hatası:', err);
      setMembers([]);
    }
  }

  async function add(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await shareProject(projectId, email.trim(), role);
      if (res === 'ok') {
        toast(`${email.trim()} eklendi.`, 'success');
        setEmail('');
        await refresh();
      } else if (res === 'no_user') {
        toast('Bu e-postayla kayıtlı kullanıcı yok (önce kaydolmalı).', 'error', 5000);
      } else if (res === 'not_owner') {
        toast('Yalnız proje sahibi paylaşabilir.', 'error');
      } else if (res === 'self') {
        toast('Zaten bu projenin sahibisin.', 'error');
      }
    } catch (err) {
      console.error('Paylaşım hatası:', err);
      toast('Paylaşılamadı.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: ProjectMember): Promise<void> {
    try {
      await removeProjectMember(projectId, m.member);
      setMembers((list) => (list ?? []).filter((x) => x.member !== m.member));
      toast('Üye çıkarıldı.', 'success');
    } catch (err) {
      console.error('Üye çıkarma hatası:', err);
      toast('Üye çıkarılamadı.', 'error');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`"${projectName}" projesini paylaş`}
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-1)]">Paylaş — {projectName}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-3)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={add} className="flex gap-2">
          <input
            ref={emailRef}
            type="email"
            required
            placeholder="e-posta@ornek.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)]"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-2)] disabled:opacity-50"
          >
            Ekle
          </button>
        </form>

        <p className="mt-2 text-xs text-[var(--text-3)]">
          Eklenen kişi giriş yaptığında projeyi "Bulut projelerim"de görür.
        </p>

        <div className="mt-4">
          <div className="mb-1.5 text-xs font-medium text-[var(--text-3)]">Üyeler</div>
          {members === null ? (
            <p className="py-2 text-sm text-[var(--text-3)]">Yükleniyor…</p>
          ) : members.length === 0 ? (
            <p className="py-2 text-sm text-[var(--text-3)]">Henüz kimseyle paylaşılmadı.</p>
          ) : (
            <ul className="space-y-1">
              {members.map((m) => (
                <li
                  key={m.member}
                  className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface)] px-3 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-1)]" title={m.email}>
                    {m.email}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--text-3)]">
                    {ROLES.find((r) => r.value === m.role)?.label ?? m.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => void remove(m)}
                    className="shrink-0 rounded px-1.5 py-0.5 text-xs text-[var(--text-3)] hover:text-red-400"
                    aria-label={`${m.email} çıkar`}
                  >
                    Çıkar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
