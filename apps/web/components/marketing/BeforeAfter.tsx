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

      {/* tutamak */}
      <div
        onPointerDown={onDown}
        className="absolute bottom-0 top-0 z-10 flex w-11 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center"
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
  return (
    <div
      className="absolute inset-0 flex items-center justify-center text-[12px] text-[var(--text-3)]"
      style={
        tone === "render"
          ? { background: "linear-gradient(160deg,#3a3357,#6b5e8c 45%,#c39d7e 85%,#e8cda6)" }
          : { background: "var(--bg-3)" }
      }
    >
      <span
        className={
          tone === "render"
            ? "rounded-md bg-black/35 px-3 py-1.5 text-white/90"
            : "v-grid rounded-md px-3 py-1.5"
        }
      >
        {label}
      </span>
    </div>
  );
}
