import Reveal from "./Reveal";
import {
  FileImport, Grid, BookOpen, Sparkle, Image, Box, Users, FileCheck, Zap,
} from "./Icons";

const FEATURES = [
  { Icon: FileImport, title: "DWG/DXF içe aktarma", desc: "AutoCAD dosyanı tarayıcıda aç, katmanları tanı, iki nokta + gerçek mesafe ile tek tıkla ölçekle." },
  { Icon: Grid, title: "Otomatik mahal & m²", desc: "Duvarlardan mahalleri otomatik bulur, alanları hesaplar ve mahal listesini Excel'e aktarır." },
  { Icon: BookOpen, title: "Türkçe yönetmelik asistanı", desc: "İmar, TBDY ve TS 9111'e dayalı, kaynak gösteren öneriler." },
  { Icon: Sparkle, title: "Tariften plan üretimi", desc: "\"90 m² 3+1 daire\" yaz, yapay zekâ yerleşim alternatiflerini saniyeler içinde üretsin." },
  { Icon: Image, title: "Plandan AI render", desc: "Atmosfer, malzeme ve ışığı tarif et; fotogerçekçi görsel üret." },
  { Icon: Box, title: "Kesit & 3B önizleme", desc: "Kesit çek, planını anında 3B'de incele ve gez." },
  { Icon: Users, title: "Gerçek zamanlı işbirliği", desc: "Linki paylaş, aynı çizimde birlikte çalış; imleçler ve yorumlar canlı." },
  { Icon: FileCheck, title: "Pafta & dışa aktarma", desc: "Pafta düzeni, metraj/maliyet ve PDF çıktısı tek akışta." },
  { Icon: Zap, title: "Hızlı ve ölçeklenebilir", desc: "WebGL motoru ile büyük çizimlerde akıcı; kurulum yok." },
];

export default function FeatureGrid() {
  return (
    <section id="ozellikler" className="mx-auto max-w-[1160px] px-6 pb-24 pt-6">
      <Reveal className="mx-auto mb-12 max-w-[620px] text-center">
        <div className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">
          Tek tuval, baştan sona
        </div>
        <h2 className="mb-3.5 text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-tight">
          Çizimden teslime kadar her şey burada
        </h2>
        <p className="text-[1.05rem] leading-relaxed text-[var(--text-2)]">
          Dosyayı aç, mahalleri bul, yönetmeliğe danış, planı üret ve paylaş — araç değiştirmeden, kurulum yapmadan.
        </p>
      </Reveal>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-[15px] border border-[var(--border)] bg-[var(--bg-2)] p-7 shadow-[inset_0_1px_0_var(--hi)] transition hover:-translate-y-[3px] hover:border-[var(--border-2)] hover:shadow-[inset_0_1px_0_var(--hi),var(--shadow)]"
          >
            <div className="mb-[18px] flex h-10 w-10 items-center justify-center rounded-[11px] bg-[var(--accent-soft)] text-[var(--accent)]">
              <f.Icon width={20} height={20} />
            </div>
            <h3 className="mb-2 text-[1.05rem] font-semibold tracking-tight">{f.title}</h3>
            <p className="text-[0.94rem] leading-relaxed text-[var(--text-2)]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
