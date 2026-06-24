import Reveal from "./Reveal";
import { FileImport, Search, Message, Sparkle, Share } from "./Icons";

const STEPS = [
  { n: "01", title: "Aç", desc: "DWG/DXF'i sürükle, katmanlar tanınsın, ölçekle.", Icon: FileImport },
  { n: "02", title: "Bul", desc: "Mahaller ve m² otomatik çıksın; liste hazır olsun.", Icon: Search },
  { n: "03", title: "Danış", desc: "Yönetmelik asistanına sor; kaynaklı yanıt al.", Icon: Message },
  { n: "04", title: "Üret", desc: "Tariften plan, plandan fotogerçekçi render üret.", Icon: Sparkle },
  { n: "05", title: "Paylaş", desc: "Link ver, birlikte çalış; pafta & PDF dışa aktar.", Icon: Share },
];

export default function Workflow() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-2)]">
      <div className="mx-auto max-w-[1160px] px-6 py-[84px]">
        <Reveal className="mb-12 max-w-[620px]">
          <div className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">
            Akış
          </div>
          <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-tight">
            Aç, bul, danış, üret, paylaş.
          </h2>
        </Reveal>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(186px,1fr))] gap-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80} className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-[22px]">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[1.6rem] font-semibold tracking-tight text-[var(--accent)]">{s.n}</span>
                <s.Icon width={19} height={19} className="text-[var(--text-3)]" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold">{s.title}</h3>
              <p className="text-[0.88rem] leading-relaxed text-[var(--text-2)]">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
