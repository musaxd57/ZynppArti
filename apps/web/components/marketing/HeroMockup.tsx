import { Sparkle } from "./Icons";

/** Hero — gerçek Vesna uygulamasının arayüz çerçevesi (üst araçlar + yan paneller). */
export default function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-[1060px] pb-24">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-2)] shadow-[0_50px_130px_-45px_rgba(0,0,0,0.7),inset_0_1px_0_var(--hi)]">
        {/* ÜST ARAÇ ÇUBUĞU */}
        <div className="flex items-center gap-1.5 overflow-hidden border-b border-[var(--border)] bg-[var(--bg-3)] px-3 py-[9px]">
          <span className="flex shrink-0 items-center pr-1.5 text-[var(--accent)]">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round"><path d="M7 13 L7 7 L13 7" /><path d="M25 19 L25 25 L19 25" /><rect x="13.5" y="13.5" width="5" height="5" rx="1" fill="currentColor" stroke="none" /></svg>
          </span>
          <span className="h-5 w-px shrink-0 bg-[var(--border)]" />
          <div className="flex shrink-0 items-center gap-0.5">
            <Tool active label="Seç"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></Tool>
            <Tool label="Duvar" rects />
            <Tool label="Kapı"><path d="M4 21h16M7 21V5h7a3 3 0 0 1 3 3v13" /><path d="M12 12h.01" /></Tool>
            <Tool label="Pencere"><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M12 4v16M4 12h16" /></Tool>
            <Tool label="Kesit"><path d="M3 12h18M8 6v12M16 6v12" /></Tool>
          </div>
          <span className="h-5 w-px shrink-0 bg-[var(--border)]" />
          <div className="flex shrink-0 items-center gap-1 text-[var(--text-3)]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h3" /></svg>
          </div>
          <span className="flex-1" />
          <span className="shrink-0 px-2 py-1.5 text-xs text-[var(--text-2)]">CAD Yükle</span>
          <span className="shrink-0 px-2 py-1.5 text-xs text-[var(--text-2)]">PDF İndir</span>
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white">
            <Sparkle width={13} height={13} className="text-white" /> Vesna AI
          </span>
        </div>

        {/* GÖVDE */}
        <div className="flex min-h-[440px]">
          {/* SOL PANEL */}
          <div className="flex w-[190px] shrink-0 flex-col gap-2 border-r border-[var(--border)] bg-[var(--bg-3)] p-3">
            <PanelRow label="KATMANLAR" badge="2" />
            <PanelRow label="BLOKLAR" />
            <div className="overflow-hidden rounded-[10px] border border-[var(--accent)] bg-[var(--bg-2)] shadow-[0_0_0_3px_var(--accent-soft),inset_0_1px_0_var(--hi)]">
              <div className="flex items-center gap-2 px-3 py-[11px]">
                <Sparkle width={13} height={13} className="text-[var(--accent)]" />
                <span className="flex-1 text-[11.5px] font-semibold tracking-wide text-[var(--text)]">COPİLOT</span>
                <span className="text-[10px] font-semibold text-[var(--accent)]">8 bulgu</span>
              </div>
              <div className="flex flex-col gap-2 px-3 pb-3">
                <div className="max-w-[92%] self-end rounded-[10px_10px_3px_10px] bg-[var(--accent)] px-2.5 py-[7px] text-[11px] leading-snug text-white">90 m² 3+1 daire planı öner</div>
                <div className="rounded-[10px_10px_10px_3px] border border-[var(--border)] bg-[var(--bg-3)] px-2.5 py-[7px] text-[11px] leading-relaxed text-[var(--text-2)]">
                  3 oda + salon hazır. Islak hacimler şafta yakın. <span className="text-[var(--accent)]">TS 9111</span> notu eklendi.
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--accent)]">
                  <span className="v-pulse h-[5px] w-[5px] rounded-full bg-[var(--accent)]" /> Render üretiliyor…
                </div>
              </div>
            </div>
          </div>

          {/* TUVAL */}
          <div className="v-grid relative min-w-0 flex-1 bg-[var(--bg)]">
            <svg viewBox="0 0 560 400" preserveAspectRatio="xMidYMid meet" className="block h-full w-full">
              <line x1="48" y1="26" x2="512" y2="26" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
              <line x1="48" y1="22" x2="48" y2="30" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
              <line x1="512" y1="22" x2="512" y2="30" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
              <rect x="258" y="18" width="46" height="16" rx="3" fill="var(--bg-2)" stroke="var(--accent)" strokeWidth={0.8} />
              <text x="281" y="29.5" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="600">12.40 m</text>

              <g className="v-in" style={{ animationDelay: "1.2s" }}>
                <rect x="304" y="44" width="208" height="200" fill="rgba(99,110,224,0.08)" />
                <rect x="304" y="244" width="208" height="112" fill="rgba(64,176,150,0.09)" />
                <rect x="48" y="244" width="132" height="112" fill="rgba(176,150,110,0.07)" />
              </g>
              <rect x="48" y="44" width="256" height="200" fill="var(--accent-soft)" className="v-in" />
              <rect x="48" y="44" width="464" height="312" fill="none" stroke="var(--text-2)" strokeWidth={3.5} className="v-draw" />
              <path d="M304 44 L304 244 M304 244 L512 244 M304 150 L380 150 M180 244 L180 356" fill="none" stroke="var(--text-2)" strokeWidth={3} className="v-draw-2" />
              <path d="M304 200 A44 44 0 0 0 260 244" fill="none" stroke="var(--text-3)" strokeWidth={1.2} opacity={0.7} />

              <g fill="var(--accent)">
                <rect x="44" y="40" width="8" height="8" /><rect x="300" y="40" width="8" height="8" />
                <rect x="44" y="240" width="8" height="8" /><rect x="300" y="240" width="8" height="8" />
              </g>

              <text x="176" y="142" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="600">Salon</text>
              <text x="176" y="160" textAnchor="middle" fill="var(--accent)" fontSize="12" fontWeight="600">32.4 m²</text>
              <text x="408" y="92" textAnchor="middle" fill="var(--text-2)" fontSize="13" fontWeight="600">Yatak Odası</text>
              <text x="408" y="109" textAnchor="middle" fill="var(--text-3)" fontSize="11">16.0 m²</text>
              <text x="408" y="300" textAnchor="middle" fill="var(--text-2)" fontSize="13" fontWeight="600">Mutfak</text>
              <text x="408" y="317" textAnchor="middle" fill="var(--text-3)" fontSize="11">12.2 m²</text>
              <text x="114" y="304" textAnchor="middle" fill="var(--text-2)" fontSize="12" fontWeight="600">Hol</text>
            </svg>

            {/* canlı paylaş / 3B */}
            <div className="v-in absolute right-4 top-3.5 flex gap-2" style={{ animationDelay: "1.6s" }}>
              <span className="flex items-center gap-[7px] rounded-full border border-[var(--border)] bg-[var(--bg-2)] px-[11px] py-1.5 text-[11.5px] font-semibold text-[var(--text)] shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                <span className="flex">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-[var(--bg-2)] bg-[var(--accent)] text-[9px] font-bold text-white">E</span>
                  <span className="-ml-1.5 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-[var(--bg-2)] bg-[var(--ok)] text-[9px] font-bold text-white">M</span>
                </span>
                Canlı Paylaş
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-2)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--text)] shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></svg>
                3B
              </span>
            </div>

            {/* imleçler */}
            <div className="v-in absolute left-[38%] top-[30%]" style={{ animationDelay: "1.7s" }}>
              <div className="v-float-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></svg>
                <span className="ml-1.5 inline-block rounded-md bg-[var(--accent)] px-[7px] py-0.5 text-[10.5px] font-semibold text-white">Elif</span>
              </div>
            </div>
            <div className="v-in absolute left-[64%] top-[58%]" style={{ animationDelay: "2s" }}>
              <div className="v-float-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--ok)"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></svg>
                <span className="ml-1.5 inline-block rounded-md bg-[var(--ok)] px-[7px] py-0.5 text-[10.5px] font-semibold text-white">Mert</span>
              </div>
            </div>

            {/* durum çubuğu */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-[13px] py-[5px] text-[11px] text-[var(--text-3)] shadow-[0_4px_14px_rgba(0,0,0,0.25)]">
              X 12.4 · Y 8.7 <span className="text-[var(--border-2)]">|</span> <span className="font-semibold text-[var(--accent)]">Seç</span>
            </div>
          </div>

          {/* SAĞ PANEL */}
          <div className="flex w-[210px] shrink-0 flex-col gap-2 border-l border-[var(--border)] bg-[var(--bg-3)] p-3">
            <PanelRow label="MAHAL LİSTESİ" badge="17" />
            <PanelRow label="METRAJ" />
            <PanelRow label="YAKLAŞIK MALİYET" value="₺1.407.208" />
            <PanelRow label="KESİT (ŞEMATİK)" />
            <div className="v-rise mt-auto overflow-hidden rounded-[11px] border border-[var(--border)] bg-[var(--bg-2)] shadow-[inset_0_1px_0_var(--hi)]" style={{ animationDelay: "1.9s" }}>
              <div className="relative h-[106px]" style={{ background: "linear-gradient(160deg,#3a3357 0%,#6b5e8c 42%,#c39d7e 82%,#e8cda6 100%)" }}>
                <div className="absolute right-4 top-3 h-[26px] w-[26px] rounded-full" style={{ background: "radial-gradient(circle,#fff6e0,rgba(255,246,224,0) 70%)" }} />
                <div className="absolute inset-x-0 bottom-0 h-[42px]" style={{ background: "linear-gradient(180deg,transparent,rgba(18,14,28,0.55))" }} />
                <div className="absolute bottom-2.5 left-3 flex gap-[5px]">
                  <span className="h-[5px] w-[34px] rounded-full bg-white/70" />
                  <span className="h-[5px] w-5 rounded-full bg-white/40" />
                </div>
              </div>
              <div className="flex items-center justify-between px-[11px] py-[9px]">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text)]">
                  <Sparkle width={12} height={12} className="text-[var(--accent)]" /> AI render
                </span>
                <span className="text-[10px] font-semibold text-[var(--ok)]">hazır · 4.2s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tool({
  label, active, rects, children,
}: {
  label: string; active?: boolean; rects?: boolean; children?: React.ReactNode;
}) {
  return (
    <span className={`flex items-center gap-1.5 rounded-lg px-[9px] py-1.5 text-xs ${active ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text-2)]"}`}>
      {rects ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="5" rx="1" /><rect x="3" y="14" width="18" height="5" rx="1" /></svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
      )}
      {label}
    </span>
  );
}

function PanelRow({ label, badge, value }: { label: string; badge?: string; value?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg-2)] px-3 py-[11px] shadow-[inset_0_1px_0_var(--hi)]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      <span className="flex-1 text-[11.5px] font-semibold tracking-wide text-[var(--text)]">{label}</span>
      {badge && <span className="text-[11px] text-[var(--text-3)]">{badge}</span>}
      {value && <span className="text-[11px] font-semibold text-[var(--accent)]">{value}</span>}
    </div>
  );
}
