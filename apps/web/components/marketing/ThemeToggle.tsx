"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "./Icons";

/** Açık/koyu tema değiştirici. Seçim localStorage'da tutulur. */
export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme !== "light");
  }, []);

  const toggle = () => {
    const next = !dark;
    const t = next ? "dark" : "light";
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("vesna-theme", t);
    } catch { /* yoksay */ }
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Temayı değiştir"
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-2)] text-[var(--text-2)] transition hover:border-[var(--border-2)] hover:text-[var(--text)]"
    >
      {dark ? <Sun width={17} height={17} /> : <Moon width={17} height={17} />}
    </button>
  );
}
