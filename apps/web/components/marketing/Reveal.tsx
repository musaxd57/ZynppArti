"use client";

import { useEffect, useRef, type ReactNode, type ElementType, type Ref } from "react";

/**
 * Çocuklarını görünür alana girince yumuşakça belirten sarmalayıcı.
 * Stil globals.css içindeki [data-reveal] / [data-shown] kurallarından gelir.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  as,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.setAttribute("data-shown", "");
            io.unobserve(el);
          }
        }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    const safety = setTimeout(() => el.setAttribute("data-shown", ""), 1600);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);

  const Tag: ElementType = as ?? "div";
  return (
    <Tag ref={ref as Ref<HTMLElement>} data-reveal style={{ transitionDelay: `${delay}ms` }} className={className}>
      {children}
    </Tag>
  );
}
