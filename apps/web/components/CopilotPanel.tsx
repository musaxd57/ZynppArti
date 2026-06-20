'use client';

import { useEffect, useState } from 'react';
import { runCopilotChecks, type Finding, type Severity } from '@zynpparti/copilot';
import type { EntityStore, Space, Wall } from '@zynpparti/document';

function getSpaces(store: EntityStore): Space[] {
  return store.all().filter((e): e is Space => e.type === 'space');
}
function getWalls(store: EntityStore): Wall[] {
  return store.all().filter((e): e is Wall => e.type === 'wall');
}

const SEVERITY_STYLE: Record<Severity, { dot: string; label: string }> = {
  error: { dot: 'bg-red-500', label: 'Hata' },
  warning: { dot: 'bg-amber-400', label: 'Uyarı' },
  info: { dot: 'bg-sky-400', label: 'Bilgi' },
};

interface CopilotPanelProps {
  store: EntityStore;
}

/**
 * Copilot — kaynak-gösteren öneri paneli (Faz 2, ADR-0014 ayak 1).
 * Çizdikçe canlı çalışır; her bulgu hangi yönetmeliğe dayandığını (atıf) gösterir.
 * Seviye 1: salt-okunur, modeli değiştirmez (AI-AGENT-VISION §2).
 */
export function CopilotPanel({ store }: CopilotPanelProps) {
  const [findings, setFindings] = useState<Finding[]>(() =>
    runCopilotChecks(getSpaces(store), getWalls(store)),
  );
  const [hasRooms, setHasRooms] = useState<boolean>(() => getSpaces(store).length > 0);

  useEffect(
    () =>
      store.subscribe(() => {
        const spaces = getSpaces(store);
        setHasRooms(spaces.length > 0);
        setFindings(runCopilotChecks(spaces, getWalls(store)));
      }),
    [store],
  );

  if (!hasRooms) return null;

  return (
    <div className="absolute bottom-4 left-4 w-80 rounded-lg bg-black/60 p-2 text-sm text-white backdrop-blur">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="font-semibold opacity-80">Copilot — Yönetmelik</span>
        <span className="text-xs opacity-50">
          {findings.length > 0 ? `${findings.length} bulgu` : 'temiz'}
        </span>
      </div>

      {findings.length === 0 ? (
        <div className="flex items-center gap-2 px-1 py-1 opacity-70">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Tohum kurallarına uygunsuz bulgu yok.
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {findings.map((f, i) => {
            const st = SEVERITY_STYLE[f.severity];
            return (
              <li key={i} className="rounded bg-white/5 p-2">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${st.dot}`} />
                  <div className="min-w-0">
                    <div>{f.message}</div>
                    <div className="mt-0.5 text-xs italic opacity-50">{f.citation}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-2 px-1 text-[10px] leading-tight opacity-40">
        Bilgilendirme amaçlıdır; yürürlükteki mevzuattan doğrulayın.
      </div>
    </div>
  );
}
