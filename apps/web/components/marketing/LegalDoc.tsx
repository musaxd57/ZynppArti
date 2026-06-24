type Section = { heading: string; body: React.ReactNode };

/** Okunur, sade tipografik yasal sayfa şablonu. */
export default function LegalDoc({
  title,
  updated = "Haziran 2026",
  intro,
  sections,
}: {
  title: string;
  updated?: string;
  intro: React.ReactNode;
  sections: Section[];
}) {
  return (
    <main className="v-page">
      <article className="mx-auto max-w-[720px] px-6 pb-24 pt-[72px]">
        <div className="mb-3.5 text-[13px] font-semibold text-[var(--text-3)]">Yasal · Son güncelleme: {updated}</div>
        <h1 className="mb-5 text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight">{title}</h1>
        <p className="mb-9 text-[1.02rem] leading-[1.7] text-[var(--text-2)]">{intro}</p>

        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="mb-3 mt-9 text-[1.25rem] font-semibold tracking-tight">{s.heading}</h2>
            <p className="text-[0.98rem] leading-[1.7] text-[var(--text-2)]">{s.body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
