const FORMATS = ["DWG", "DXF", "IFC", "PDF", "SVG", "PNG", "Excel", "JPG", "GLB · 3B"];

/** Desteklenen formatların sonsuz akan şeridi. */
export default function Marquee() {
  return (
    <section className="overflow-hidden border-y border-[var(--border)] bg-[var(--bg-2)]">
      <div className="mx-auto flex max-w-[1160px] items-center gap-7 px-6 py-5">
        <span className="shrink-0 text-[11.5px] font-semibold uppercase tracking-[0.07em] text-[var(--text-3)]">
          Açar · aktarır · üretir
        </span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
          <div className="v-marquee flex w-max gap-9">
            {[0, 1].map((copy) => (
              <span key={copy} aria-hidden={copy === 1} className="flex gap-9 pr-9">
                {FORMATS.map((f) => (
                  <span key={f} className="whitespace-nowrap text-[15px] font-semibold text-[var(--text-2)]">
                    {f}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
