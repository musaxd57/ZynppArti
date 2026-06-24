import { Sparkle } from "./Icons";

/** Hero'daki canlı CAD arayüzü çerçevesi (plan çizilerek belirir, imleçler süzülür). */
export default function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-[1060px] pb-24">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-2)] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.55)]">
        {/* pencere çubuğu */}
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--bg-3)] px-4 py-[11px]">
          <div className="flex gap-[7px]">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ED6A5E]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#F4BE4F]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#61C554]" />
          </div>
          <div className="flex flex-1 justify-center">
            <span className="rounded-md border border-[var(--border)] bg-[var(--bg-2)] px-3 py-1 text-[12.5px] text-[var(--text-3)]">
              Vesna — Kat-Plani.dwg
            </span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--bg-3)] bg-[var(--accent)] text-[11px] font-semibold text-white">E</span>
            <span className="-ml-[7px] inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--bg-3)] bg-[var(--ok)] text-[11px] font-semibold text-white">M</span>
          </div>
        </div>

        {/* gövde */}
        <div className="flex min-h-[440px]">
          {/* araç çubuğu */}
          <div className="flex w-[52px] flex-col items-center gap-1.5 border-r border-[var(--border)] bg-[var(--bg-3)] py-3">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[var(--accent-soft)] text-[var(--accent)]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></svg>
            </span>
            {["M12 19l7-7 3 3-7 7-3-3z", "rect", "plus", "text", "layers"].map((_, i) => (
              <span key={i} className="h-[34px] w-[34px] rounded-[9px]" />
            ))}
          </div>

          {/* tuval */}
          <div className="v-grid relative min-w-0 flex-1 bg-[var(--bg)]">
            <svg viewBox="0 0 560 400" preserveAspectRatio="xMidYMid meet" className="block h-full w-full">
              <line x1="48" y1="26" x2="512" y2="26" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
              <line x1="48" y1="22" x2="48" y2="30" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
              <line x1="512" y1="22" x2="512" y2="30" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
              <rect x="258" y="18" width="46" height="16" rx="3" fill="var(--bg-2)" stroke="var(--accent)" strokeWidth={0.8} />
              <text x="281" y="29.5" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="600">12.40 m</text>

              <rect x="48" y="44" width="256" height="200" fill="var(--accent-soft)" className="v-in" />
              <rect x="48" y="44" width="464" height="312" fill="none" stroke="var(--text-2)" strokeWidth={3.5} className="v-draw" />
              <path d="M304 44 L304 244 M304 244 L512 244 M304 150 L380 150 M180 244 L180 356" fill="none" stroke="var(--text-2)" strokeWidth={3} className="v-draw-2" />
              <path d="M304 200 A44 44 0 0 0 260 244" fill="none" stroke="var(--text-3)" strokeWidth={1.2} opacity={0.7} />

              <g fill="var(--accent)">
                <rect x="44" y="40" width="8" height="8" />
                <rect x="300" y="40" width="8" height="8" />
                <rect x="44" y="240" width="8" height="8" />
                <rect x="300" y="240" width="8" height="8" />
              </g>

              <text x="176" y="142" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="600">Salon</text>
              <text x="176" y="160" textAnchor="middle" fill="var(--accent)" fontSize="12" fontWeight="600">32.4 m²</text>
              <text x="408" y="92" textAnchor="middle" fill="var(--text-2)" fontSize="13" fontWeight="600">Yatak Odası</text>
              <text x="408" y="109" textAnchor="middle" fill="var(--text-3)" fontSize="11">16.0 m²</text>
              <text x="408" y="300" textAnchor="middle" fill="var(--text-2)" fontSize="13" fontWeight="600">Mutfak</text>
              <text x="408" y="317" textAnchor="middle" fill="var(--text-3)" fontSize="11">12.2 m²</text>
              <text x="114" y="304" textAnchor="middle" fill="var(--text-2)" fontSize="12" fontWeight="600">Hol</text>
            </svg>

            {/* işbirlikçi imleçleri */}
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
          </div>

          {/* AI paneli */}
          <div className="flex w-[236px] flex-col gap-3 border-l border-[var(--border)] bg-[var(--bg-3)] p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text)]">
              <Sparkle width={15} height={15} className="text-[var(--accent)]" />
              Vesna Asistan
            </div>
            <div className="max-w-[88%] self-end rounded-[11px_11px_3px_11px] bg-[var(--accent)] px-[11px] py-2 text-[12px] leading-snug text-white">
              90 m² 3+1 daire planı öner
            </div>
            <div className="max-w-[92%] rounded-[11px_11px_11px_3px] border border-[var(--border)] bg-[var(--bg-2)] px-[11px] py-2 text-[12px] leading-relaxed text-[var(--text-2)]">
              3 oda + salon yerleşimi hazır. Islak hacimler tesisat şaftına yakın.{" "}
              <span className="text-[var(--accent)]">TS 9111</span> erişilebilirlik notu eklendi.
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-md border border-[var(--border)] px-2 py-[3px] text-[11px] text-[var(--text-3)]">Salon 32 m²</span>
              <span className="rounded-md border border-[var(--border)] px-2 py-[3px] text-[11px] text-[var(--text-3)]">3 Y. Odası</span>
            </div>
            <div className="mt-auto flex items-center gap-[7px] text-[11.5px] text-[var(--accent)]">
              <span className="v-pulse h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Render üretiliyor…
            </div>
          </div>
        </div>
      </div>

      {/* yüzen AI render kartı */}
      <div className="v-rise absolute bottom-[60px] right-1.5 w-[214px] overflow-hidden rounded-[13px] border border-[var(--border)] bg-[var(--bg-2)] shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)]" style={{ animationDelay: "1.95s" }}>
        <div className="relative h-[120px]" style={{ background: "linear-gradient(160deg,#3a3357 0%,#6b5e8c 40%,#c39d7e 80%,#e8cda6 100%)" }}>
          <div className="absolute right-[18px] top-3.5 h-7 w-7 rounded-full" style={{ background: "radial-gradient(circle,#fff6e0,rgba(255,246,224,0) 70%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-[46px]" style={{ background: "linear-gradient(180deg,transparent,rgba(18,14,28,0.55))" }} />
          <div className="absolute bottom-3 left-3.5 flex gap-[5px]">
            <span className="h-1.5 w-[38px] rounded-full bg-white/70" />
            <span className="h-1.5 w-[22px] rounded-full bg-white/40" />
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--text)]">
            <Sparkle width={13} height={13} className="text-[var(--accent)]" />
            AI render
          </span>
          <span className="text-[10.5px] font-semibold text-[var(--ok)]">hazır · 4.2s</span>
        </div>
      </div>
    </div>
  );
}
