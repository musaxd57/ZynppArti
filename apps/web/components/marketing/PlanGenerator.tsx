"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkle, Grid, Refresh } from "./Icons";

const PROMPT = "90 m² 3+1 daire · geniş salon · ebeveyn banyolu";

type Plan = {
  id: string;
  name: string;
  efficiency: string;
  tags: string[];
  plan: React.ReactNode;
};

const PLANS: Plan[] = [
  {
    id: "A",
    name: "Alternatif A",
    efficiency: "%86",
    tags: ["Geniş salon", "3+1", "90 m²"],
    plan: (
      <svg viewBox="0 0 220 150" className="block h-auto w-full">
        <rect x="12" y="12" width="124" height="126" fill="var(--accent-soft)" />
        <rect x="12" y="12" width="196" height="126" fill="none" stroke="var(--text-2)" strokeWidth={3} />
        <path d="M136 12 L136 138 M136 78 L208 78" fill="none" stroke="var(--text-2)" strokeWidth={2} />
        <text x="74" y="79" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="600">Salon</text>
        <text x="172" y="49" textAnchor="middle" fill="var(--text-2)" fontSize="9" fontWeight="600">Yatak</text>
        <text x="172" y="112" textAnchor="middle" fill="var(--text-2)" fontSize="9" fontWeight="600">Mutfak</text>
      </svg>
    ),
  },
  {
    id: "B",
    name: "Alternatif B",
    efficiency: "%91",
    tags: ["Ebeveyn süiti", "3+1", "90 m²"],
    plan: (
      <svg viewBox="0 0 220 150" className="block h-auto w-full">
        <rect x="12" y="96" width="118" height="42" fill="var(--accent-soft)" />
        <rect x="12" y="12" width="196" height="126" fill="none" stroke="var(--text-2)" strokeWidth={3} />
        <path d="M130 12 L130 138 M130 74 L208 74 M12 96 L130 96" fill="none" stroke="var(--text-2)" strokeWidth={2} />
        <text x="71" y="121" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="600">Ebeveyn</text>
        <text x="71" y="58" textAnchor="middle" fill="var(--text-2)" fontSize="9" fontWeight="600">Salon</text>
        <text x="169" y="46" textAnchor="middle" fill="var(--text-2)" fontSize="9" fontWeight="600">Yatak</text>
        <text x="169" y="110" textAnchor="middle" fill="var(--text-2)" fontSize="9" fontWeight="600">Mutfak</text>
      </svg>
    ),
  },
  {
    id: "C",
    name: "Alternatif C",
    efficiency: "%88",
    tags: ["Açık mutfak", "3+1", "90 m²"],
    plan: (
      <svg viewBox="0 0 220 150" className="block h-auto w-full">
        <rect x="12" y="12" width="196" height="78" fill="var(--accent-soft)" />
        <rect x="12" y="12" width="196" height="126" fill="none" stroke="var(--text-2)" strokeWidth={3} />
        <path d="M12 90 L208 90 M110 90 L110 138" fill="none" stroke="var(--text-2)" strokeWidth={2} />
        <text x="110" y="55" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="600">Açık mutfak</text>
        <text x="61" y="117" textAnchor="middle" fill="var(--text-2)" fontSize="9" fontWeight="600">Yatak</text>
        <text x="159" y="117" textAnchor="middle" fill="var(--text-2)" fontSize="9" fontWeight="600">Banyo</text>
      </svg>
    ),
  },
];

/** "Yaz → Üret" etkileşimli AI plan üreteci demosu. */
export default function PlanGenerator() {
  const [typed, setTyped] = useState("");
  const [generated, setGenerated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const startTyping = () => {
    let i = 0;
    const step = () => {
      if (i <= PROMPT.length) {
        setTyped(PROMPT.slice(0, i));
        i += 1;
        timer.current = setTimeout(step, 52);
      }
    };
    step();
  };

  useEffect(() => {
    startTyping();
    return () => clearTimeout(timer.current);
  }, []);

  const regen = () => {
    clearTimeout(timer.current);
    setGenerated(false);
    setTyped("");
    setTimeout(startTyping, 120);
  };

  return (
    <div className="mx-auto max-w-[880px] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--bg-2)] shadow-[0_30px_80px_-44px_rgba(0,0,0,0.55)]">
      {/* prompt çubuğu */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-[18px] py-4">
        <Sparkle width={18} height={18} className="shrink-0 text-[var(--accent)]" />
        <div className="min-w-[160px] flex-1 text-[15px] leading-snug text-[var(--text)]">
          {typed}
        </div>
        <button
          onClick={() => setGenerated(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-[9px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-[9px] text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--accent-2)]"
        >
          Üret
          <span className="rounded border border-white/40 px-[5px] text-xs opacity-80">⏎</span>
        </button>
      </div>

      {/* sonuç alanı */}
      <div className="v-grid min-h-[300px] bg-[var(--bg)] p-6">
        {!generated ? (
          <div className="flex min-h-[252px] flex-col items-center justify-center gap-3.5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-[var(--accent-soft)] text-[var(--accent)]">
              <Grid width={24} height={24} />
            </div>
            <div className="max-w-[320px] text-[0.95rem] leading-relaxed text-[var(--text-2)]">
              &quot;Üret&quot;e bas — yapay zekâ{" "}
              <strong className="text-[var(--text)]">3 yerleşim alternatifi</strong> önersin.
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[0.9rem] text-[var(--text-2)]">
                <span className="h-[7px] w-[7px] rounded-full bg-[var(--ok)]" />
                3 alternatif üretildi · TS 9111 kontrol edildi
              </span>
              <button
                onClick={regen}
                className="inline-flex items-center gap-[7px] rounded-lg border border-[var(--border-2)] bg-[var(--bg-2)] px-[13px] py-[7px] text-[13px] font-semibold text-[var(--text)] transition hover:border-[var(--text-3)]"
              >
                <Refresh width={13} height={13} />
                Yeniden üret
              </button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              {PLANS.map((p, i) => (
                <div
                  key={p.id}
                  className="v-rise overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--bg-2)] transition hover:border-[var(--accent)]"
                  style={{ animationDelay: `${0.05 + i * 0.13}s` }}
                >
                  <div className="border-b border-[var(--border)] bg-[var(--bg-3)] p-3.5">{p.plan}</div>
                  <div className="p-3.5">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-[0.92rem] font-semibold">{p.name}</span>
                      <span className="text-[11px] font-semibold text-[var(--ok)]">Verim {p.efficiency}</span>
                    </div>
                    <div className="mb-3.5 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="rounded-md border border-[var(--border)] px-2 py-[3px] text-[11px] text-[var(--text-3)]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/app"
                      className="block w-full rounded-[9px] border border-[var(--border-2)] bg-[var(--bg-3)] py-[9px] text-center text-[13px] font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      Bu planı seç
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
