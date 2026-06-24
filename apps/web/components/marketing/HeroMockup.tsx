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
            {/* Etiketli ilk araçlar */}
            <Tool active label="Seç"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></Tool>
            <Tool label="Duvar" rects />
            <Tool label="Kapı"><path d="M4 21h16M7 21V5h7a3 3 0 0 1 3 3v13" /><path d="M12 12h.01" /></Tool>
            <Tool label="Pencere"><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M12 4v16M4 12h16" /></Tool>
            {/* Gerçek app'teki diğer araçlar (ikon-only, sığması için) */}
            <Tool label="Ölçü"><path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4Z" /><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2" /></Tool>
            <Tool label="Parsel"><rect x="3" y="3" width="18" height="18" rx="1" strokeDasharray="3 3" /></Tool>
            <Tool label="Metin"><path d="M4 7V4h16v3M9 20h6M12 4v16" /></Tool>
            <Tool label="Pafta"><path d="M14 2v6h6M5 2h9l6 6v14H5z" /></Tool>
            <Tool label="Kesit"><path d="M3 12h18M8 6v12M16 6v12" /></Tool>
            <Tool label="Yorum"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Tool>
            <Tool label="Sil"><path d="m7 21 10-10 4 4-7 7zM18 13 8 3l-5 5 10 10" /></Tool>
            <Tool label="Ölçekle"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></Tool>
          </div>
          <span className="h-5 w-px shrink-0 bg-[var(--border)]" />
          <div className="flex shrink-0 items-center gap-1 text-[var(--text-3)]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h3" /></svg>
          </div>
          <span className="flex-1" />
          <span className="hidden shrink-0 px-2 py-1.5 text-xs text-[var(--text-2)] lg:inline">Kaydet</span>
          <span className="shrink-0 px-2 py-1.5 text-xs text-[var(--text-2)]">CAD Yükle</span>
          <span className="hidden shrink-0 px-2 py-1.5 text-xs text-[var(--text-2)] lg:inline">PDF İndir</span>
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
            {/* COPİLOT = deterministik, ATIFLI yönetmelik bulguları (gerçek app'teki gibi — sohbet DEĞİL).
                AI'a yazılan istem ayrı "Vesna AI" baloncuğunda (tuvalin üstünde, aşağıda). */}
            <div className="overflow-hidden rounded-[10px] border border-[var(--accent)] bg-[var(--bg-2)] shadow-[0_0_0_3px_var(--accent-soft),inset_0_1px_0_var(--hi)]">
              <div className="flex items-center gap-2 px-3 py-[11px]">
                <Sparkle width={13} height={13} className="text-[var(--accent)]" />
                <span className="flex-1 text-[11.5px] font-semibold tracking-wide text-[var(--text)]">COPİLOT</span>
                <span className="text-[10px] font-semibold text-[var(--accent)]">3 bulgu</span>
              </div>
              <div className="flex flex-col gap-1.5 px-3 pb-3">
                <Finding ok text="3+1 · tüm odalar asgari ölçüde" cite="İmar" />
                <Finding text="Banyo penceresiz — havalandırma şaftı" cite="TS 9111" />
                <Finding ok text="Geçiş genişliği ≥ 120 cm" cite="TS 9111" />
              </div>
            </div>
          </div>

          {/* TUVAL */}
          <div className="v-grid relative min-w-0 flex-1 bg-[var(--bg)]">
            {/* Vesna AI — bu planı üreten İSTEM (COPİLOT'tan ayrı; AI'a yazılan şey). */}
            <div className="absolute bottom-3 left-3 z-10 flex max-w-[228px] items-start gap-2 rounded-xl border border-[var(--accent)] bg-[var(--bg-2)] px-2.5 py-2 shadow-[0_12px_34px_-14px_rgba(0,0,0,0.65)]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]">
                <Sparkle width={11} height={11} className="text-white" />
              </span>
              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--accent)]">Vesna AI</div>
                <div className="text-[11px] leading-snug text-[var(--text-2)]">“Ferah, geniş salonlu 3+1 daire çiz”</div>
              </div>
            </div>
            <svg viewBox="0 0 560 400" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" role="img" aria-label="Örnek 3+1 kat planı: giriş kapısından merkezi Hol'e; ferah Salon, Ebeveyn, Yatak ve Çocuk Odası, Mutfak, Banyo">
              <line x1="48" y1="26" x2="512" y2="26" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
              <line x1="48" y1="22" x2="48" y2="30" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
              <line x1="512" y1="22" x2="512" y2="30" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
              <rect x="266" y="18" width="46" height="16" rx="3" fill="var(--bg-2)" stroke="var(--accent)" strokeWidth={0.8} />
              <text x="289" y="29.5" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="600">11.60 m</text>

              {/* MANTIKLI 3+1 (promo ile aynı kurgu): GİRİŞ KAPISI (alt) → HOL (merkez omurga) → odalar.
                  SOL zon: Salon(ferah, büyük)+Mutfak+Banyo · MERKEZ: Hol(antre, tüm odalara) · SAĞ: 3 oda.
                  Çocuk odası girişte değil; ıslak hacimler (mutfak+banyo) yan yana. */}
              <g className="v-in" style={{ animationDelay: "1.2s" }}>
                <rect x="48" y="228" width="186" height="68" fill="rgba(64,176,150,0.07)" />
                <rect x="48" y="296" width="186" height="60" fill="rgba(99,110,224,0.05)" />
                <rect x="234" y="44" width="74" height="312" fill="rgba(176,150,110,0.06)" />
                <rect x="308" y="44" width="204" height="119" fill="rgba(99,110,224,0.06)" />
                <rect x="308" y="163" width="204" height="97" fill="rgba(99,110,224,0.05)" />
                <rect x="308" y="260" width="204" height="96" fill="rgba(99,110,224,0.045)" />
              </g>
              <rect x="48" y="44" width="186" height="184" fill="var(--accent-soft)" className="v-in" />
              {/* Dış duvar */}
              <rect x="48" y="44" width="464" height="312" fill="none" stroke="var(--text-2)" strokeWidth={3.5} className="v-draw" />
              {/* İç duvarlar: Hol dikeyleri x234/x308, sol yatay y228/y296, sağ yatay y163/y260 */}
              <path d="M234 44 L234 356 M308 44 L308 356 M48 228 L234 228 M48 296 L234 296 M308 163 L512 163 M308 260 L512 260" fill="none" stroke="var(--text-2)" strokeWidth={3} className="v-draw-2" />
              {/* GİRİŞ KAPISI (dış cephe alt, Hol'e açılır) — accent vurgulu */}
              <rect x="248" y="353" width="46" height="6" fill="var(--bg)" />
              <path d="M258 356 A30 30 0 0 1 288 326" fill="none" stroke="var(--accent)" strokeWidth={1.7} opacity={0.9} />
              <line x1="258" y1="356" x2="258" y2="326" stroke="var(--accent)" strokeWidth={1.7} opacity={0.9} />
              {/* İç kapı yayları — hepsi Hol'e açılır */}
              <path d="M234 138 A26 26 0 0 0 208 112" fill="none" stroke="var(--text-3)" strokeWidth={1.2} opacity={0.7} />
              <path d="M234 276 A22 22 0 0 0 212 254" fill="none" stroke="var(--text-3)" strokeWidth={1.2} opacity={0.7} />
              <path d="M234 340 A20 20 0 0 0 214 320" fill="none" stroke="var(--text-3)" strokeWidth={1.2} opacity={0.7} />
              <path d="M308 86 A26 26 0 0 1 334 112" fill="none" stroke="var(--text-3)" strokeWidth={1.2} opacity={0.7} />
              <path d="M308 198 A24 24 0 0 1 332 222" fill="none" stroke="var(--text-3)" strokeWidth={1.2} opacity={0.7} />
              <path d="M308 322 A22 22 0 0 1 330 300" fill="none" stroke="var(--text-3)" strokeWidth={1.2} opacity={0.7} />

              {/* Pencereler — dış cephede (Hol giriş kapısı hariç); salon+yataklar+mutfak ışık alır */}
              <g>
                <rect x="100" y="41" width="56" height="6" fill="var(--bg)" />
                <line x1="100" y1="44" x2="156" y2="44" stroke="var(--accent)" strokeWidth={1.6} opacity={0.75} />
                <rect x="350" y="41" width="60" height="6" fill="var(--bg)" />
                <line x1="350" y1="44" x2="410" y2="44" stroke="var(--accent)" strokeWidth={1.6} opacity={0.75} />
                <rect x="45" y="92" width="6" height="52" fill="var(--bg)" />
                <line x1="48" y1="92" x2="48" y2="144" stroke="var(--accent)" strokeWidth={1.6} opacity={0.75} />
                <rect x="45" y="240" width="6" height="44" fill="var(--bg)" />
                <line x1="48" y1="240" x2="48" y2="284" stroke="var(--accent)" strokeWidth={1.6} opacity={0.75} />
                <rect x="509" y="86" width="6" height="50" fill="var(--bg)" />
                <line x1="512" y1="86" x2="512" y2="136" stroke="var(--accent)" strokeWidth={1.6} opacity={0.75} />
                <rect x="509" y="290" width="6" height="50" fill="var(--bg)" />
                <line x1="512" y1="290" x2="512" y2="340" stroke="var(--accent)" strokeWidth={1.6} opacity={0.75} />
              </g>

              {/* Salon seçim köşeleri (ferah geniş salon) */}
              <g fill="var(--accent)">
                <rect x="44" y="40" width="8" height="8" /><rect x="230" y="40" width="8" height="8" />
                <rect x="44" y="224" width="8" height="8" /><rect x="230" y="224" width="8" height="8" />
              </g>

              <text x="141" y="130" textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="600">Salon</text>
              <text x="141" y="149" textAnchor="middle" fill="var(--accent)" fontSize="12" fontWeight="600">30.0 m²</text>
              <text x="141" y="266" textAnchor="middle" fill="var(--text-2)" fontSize="11.5" fontWeight="600">Mutfak</text>
              <text x="141" y="282" textAnchor="middle" fill="var(--text-3)" fontSize="10">10.0 m²</text>
              <text x="141" y="329" textAnchor="middle" fill="var(--text-2)" fontSize="11" fontWeight="600">Banyo</text>
              <text x="141" y="344" textAnchor="middle" fill="var(--text-3)" fontSize="9.5">5.5 m²</text>
              <text x="271" y="194" textAnchor="middle" fill="var(--text-2)" fontSize="11.5" fontWeight="600">Hol</text>
              <text x="271" y="210" textAnchor="middle" fill="var(--text-3)" fontSize="10">9.0 m²</text>
              <text x="410" y="98" textAnchor="middle" fill="var(--text-2)" fontSize="12.5" fontWeight="600">Ebeveyn Y.O.</text>
              <text x="410" y="115" textAnchor="middle" fill="var(--text-3)" fontSize="11">15.0 m²</text>
              <text x="410" y="207" textAnchor="middle" fill="var(--text-2)" fontSize="12.5" fontWeight="600">Yatak Odası</text>
              <text x="410" y="224" textAnchor="middle" fill="var(--text-3)" fontSize="11">12.0 m²</text>
              <text x="410" y="304" textAnchor="middle" fill="var(--text-2)" fontSize="12" fontWeight="600">Çocuk Odası</text>
              <text x="410" y="321" textAnchor="middle" fill="var(--text-3)" fontSize="11">12.0 m²</text>
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
              <div className="relative h-[106px]" style={{ background: "linear-gradient(160deg,#dcefff 0%,#e9f1ee 48%,#f4ead7 100%)" }}>
                <div className="absolute right-4 top-3 h-[26px] w-[26px] rounded-full" style={{ background: "radial-gradient(circle,#fff6e0,rgba(255,246,224,0) 70%)" }} />
                <div className="absolute inset-x-0 bottom-0 h-[42px]" style={{ background: "linear-gradient(180deg,transparent,rgba(150,135,100,0.18))" }} />
                <div className="absolute bottom-2.5 left-3 flex gap-[5px]">
                  <span className="h-[5px] w-[34px] rounded-full bg-[#9c8a66]/70" />
                  <span className="h-[5px] w-5 rounded-full bg-[#9c8a66]/40" />
                </div>
              </div>
              <div className="flex items-center justify-between px-[11px] py-[9px]">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text)]">
                  <Sparkle width={12} height={12} className="text-[var(--accent)]" /> AI render
                </span>
                <span className="text-[10px] font-semibold text-[var(--ok)]">hazır</span>
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
  label?: string; active?: boolean; rects?: boolean; children?: React.ReactNode;
}) {
  return (
    <span title={label} className={`flex items-center gap-1.5 rounded-lg px-[9px] py-1.5 text-xs ${active ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text-2)]"}`}>
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

/** COPİLOT bulgu satırı — atıflı (kaynak gösteren) deterministik yönetmelik kontrolü. */
function Finding({ ok, text, cite }: { ok?: boolean; text: string; cite: string }) {
  return (
    <div className="flex gap-1.5 rounded-lg bg-[var(--bg-3)] px-2 py-1.5">
      <span className={`mt-px text-[10px] leading-none ${ok ? 'text-[var(--ok)]' : 'text-[#e0a23a]'}`}>{ok ? '✓' : '⚠'}</span>
      <span className="text-[10.5px] leading-snug text-[var(--text-2)]">
        {text} <span className="text-[var(--accent)]">· {cite}</span>
      </span>
    </div>
  );
}
