"use client";

import { useRef, useState } from "react";
import { Compare } from "./Icons";

/**
 * Plan ↔ Render sürüklenebilir karşılaştırma kaydırıcısı.
 * Kendi görsellerinizi planSrc / renderSrc ile verin; boşsa yer tutucu görünür.
 */
export default function BeforeAfter({
  planSrc,
  renderSrc,
}: {
  planSrc?: string;
  renderSrc?: string;
}) {
  const [pct, setPct] = useState(50);
  const box = useRef<HTMLDivElement>(null);

  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPct(Math.max(6, Math.min(94, ((clientX - r.left) / r.width) * 100)));
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const onMove = (ev: PointerEvent) => move(ev.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={box}
      className="relative aspect-[4/3] touch-none select-none overflow-hidden rounded-2xl border border-[var(--border)] shadow-[0_30px_70px_-40px_rgba(0,0,0,0.5)]"
    >
      {/* alt: render */}
      <Layer src={renderSrc} label="Render görseli" tone="render" />
      {/* üst: plan (kırpılır) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
        <Layer src={planSrc} label="Plan görseli" tone="plan" />
      </div>

      <span className="pointer-events-none absolute left-3 top-[11px] rounded-md bg-black/55 px-[9px] py-[3px] text-[10.5px] font-bold tracking-wider text-white">
        PLAN
      </span>
      <span className="pointer-events-none absolute right-3 top-[11px] rounded-md bg-[var(--accent)] px-[9px] py-[3px] text-[10.5px] font-bold tracking-wider text-white">
        RENDER
      </span>

      {/* tutamak — klavye + ARIA erişilebilir (WCAG 2.1.1 / 4.1.3) */}
      <div
        onPointerDown={onDown}
        role="slider"
        tabIndex={0}
        aria-label="Plan ve render karşılaştırma kaydırıcısı"
        aria-valuemin={6}
        aria-valuemax={94}
        aria-valuenow={Math.round(pct)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setPct((p) => Math.max(6, p - 4));
          else if (e.key === 'ArrowRight') setPct((p) => Math.min(94, p + 4));
          else if (e.key === 'Home') setPct(6);
          else if (e.key === 'End') setPct(94);
          else return;
          e.preventDefault();
        }}
        className="absolute bottom-0 top-0 z-10 flex w-11 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center outline-none focus-visible:[&>div:last-child]:ring-2 focus-visible:[&>div:last-child]:ring-[var(--accent)]"
        style={{ left: `${pct}%` }}
      >
        <div className="absolute bottom-0 top-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)]" />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#16161B] shadow-[0_3px_10px_rgba(0,0,0,0.35)]">
          <Compare width={18} height={18} />
        </div>
      </div>
    </div>
  );
}

function Layer({
  src,
  label,
  tone,
}: {
  src?: string;
  label: string;
  tone: "plan" | "render";
}) {
  if (src) {
    return <img src={src} alt={label} className="absolute inset-0 h-full w-full object-cover" />;
  }
  // Görsel verilmediyse İLLÜSTRATİF içerik (hero mockup ile aynı dil): plan = çizgi kat planı,
  // render = gradyan iç mekan sahnesi. Gerçek görsel gelince planSrc/renderSrc ile değişir.
  if (tone === "render") {
    return (
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#3a3357 0%,#6b5e8c 42%,#c39d7e 82%,#e8cda6 100%)" }}>
        <div className="absolute right-[14%] top-[16%] h-12 w-12 rounded-full" style={{ background: "radial-gradient(circle,#fff6e0,rgba(255,246,224,0) 70%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: "linear-gradient(180deg,transparent,rgba(18,14,28,0.5))" }} />
        <div className="absolute bottom-[14%] left-[12%] flex gap-2">
          <span className="h-2 w-16 rounded-full bg-white/70" />
          <span className="h-2 w-9 rounded-full bg-white/40" />
        </div>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-black/35 px-3 py-1 text-[11px] font-medium text-white/90">{label} · örnek</span>
      </div>
    );
  }
  return (
    <div className="v-grid absolute inset-0" style={{ background: "var(--bg-3)" }}>
      <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        {/* Tutarlı 4 oda: x180 dikey, sol y130 yatay (Salon|Hol), sağ y120 yatay (Yatak|Mutfak) */}
        <rect x="36" y="30" width="144" height="100" fill="var(--accent-soft)" />
        <rect x="36" y="30" width="248" height="180" fill="none" stroke="var(--text-2)" strokeWidth={4} />
        <path d="M180 30 L180 210 M36 130 L180 130 M180 120 L284 120" fill="none" stroke="var(--text-2)" strokeWidth={3} />
        <path d="M180 86 A26 26 0 0 0 154 112" fill="none" stroke="var(--text-3)" strokeWidth={1.5} opacity={0.7} />
        <path d="M96 130 A24 24 0 0 1 120 106" fill="none" stroke="var(--text-3)" strokeWidth={1.5} opacity={0.7} />
        <text x="108" y="78" textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="600">Salon</text>
        <text x="108" y="94" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="600">32.4 m²</text>
        <text x="232" y="74" textAnchor="middle" fill="var(--text-2)" fontSize="11" fontWeight="600">Yatak</text>
        <text x="232" y="90" textAnchor="middle" fill="var(--text-3)" fontSize="9">16.0 m²</text>
        <text x="232" y="166" textAnchor="middle" fill="var(--text-2)" fontSize="11" fontWeight="600">Mutfak</text>
        <text x="232" y="182" textAnchor="middle" fill="var(--text-3)" fontSize="9">12.2 m²</text>
        <text x="108" y="172" textAnchor="middle" fill="var(--text-2)" fontSize="11" fontWeight="600">Hol</text>
        <text x="108" y="188" textAnchor="middle" fill="var(--text-3)" fontSize="9">9.0 m²</text>
      </svg>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md border border-[var(--border)] bg-[var(--bg-2)] px-3 py-1 text-[11px] font-medium text-[var(--text-3)]">{label} · örnek</span>
    </div>
  );
}
