import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export const metadata: Metadata = {
  title: "Fiyatlandırma — Vesna",
  description: "Vesna planları: Ücretsiz, Pro ve Stüdyo. Tarayıcıda mimari tasarım, m² otomasyonu ve yapay zekâ.",
};

type Plan = {
  name: string;
  blurb: string;
  price: string;
  unit: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Ücretsiz",
    blurb: "Bireysel keşif için.",
    price: "₺0",
    unit: "/ sonsuza dek",
    cta: "Ücretsiz Başla",
    features: ["3 aktif proje", "DWG/DXF içe aktarma", "Otomatik mahal & m²", "Temel 3B önizleme", "Topluluk desteği"],
  },
  {
    name: "Pro",
    blurb: "Bağımsız mimarlar için.",
    price: "$12",
    unit: "/ ay",
    cta: "Pro'ya Geç",
    featured: true,
    features: [
      "Sınırsız proje",
      "Türkçe yönetmelik asistanı",
      "Tariften plan üretimi",
      "Plandan AI render (aylık kota)",
      "Gerçek zamanlı işbirliği (5 kişi)",
      "Pafta & PDF dışa aktarma",
      "Öncelikli destek",
    ],
  },
  {
    name: "Stüdyo",
    blurb: "Ekipler ve ofisler için.",
    price: "$29",
    unit: "/ ay · kullanıcı",
    cta: "Stüdyo'yu Seç",
    features: [
      "Pro'daki her şey",
      "Sınırsız işbirlikçi",
      "Yüksek AI render kotası",
      "Marka / şablon kütüphanesi",
      "SSO & yönetim",
      "Özel onboarding",
    ],
  },
];

const FAQ = [
  { q: "Vesna gerçekten tarayıcıda mı çalışıyor?", a: "Evet. Hiçbir kurulum, lisans ya da eklenti gerekmez. Modern bir tarayıcı yeterli; çizim motoru WebGL ile cihazında akıcı çalışır." },
  { q: "DWG/DXF dosyalarımı içe aktarabilir miyim?", a: "AutoCAD DWG ve DXF dosyalarını sürükle-bırak ile açabilirsin. Katmanlar otomatik tanınır; iki nokta ve gerçek mesafeyle tek tıkla doğru ölçeğe oturtursun." },
  { q: "Yapay zekâ önerileri yönetmeliğe uygun mu?", a: "Asistan; İmar yönetmeliği, TBDY ve TS 9111 gibi kaynaklara dayalı, atıf gösteren öneriler sunar. Nihai sorumluluk her zaman projeyi yürüten mimara aittir; öneriler bir karar destek aracıdır." },
  { q: "Verilerim güvende mi?", a: "Projeleriniz size aittir. Veriler aktarımda ve sunucuda şifrelenir; dışa aktarma her zaman açıktır. Çizimlerinizi istediğiniz an indirebilir ya da silebilirsiniz." },
  { q: "Planımı sonradan değiştirebilir veya iptal edebilir miyim?", a: "Evet, dilediğin zaman yükselt, düşür veya iptal et. İptalde dönem sonuna kadar erişim devam eder, ek ücret alınmaz." },
];

export default function PricingPage() {
  return (
    <>
    <SiteHeader />
    <main className="v-page">
      <section className="mx-auto max-w-[1160px] px-6 pb-6 pt-20 text-center">
        <div className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">Fiyatlandırma</div>
        <h1 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight">
          Projene göre ölçeklenen planlar
        </h1>
        <p className="mx-auto max-w-[560px] text-[1.08rem] leading-relaxed text-[var(--text-2)]">
          Ücretsiz keşfet, ekibinle büyü. İstediğin zaman yükselt veya iptal et.
        </p>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-6 pt-12">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-5">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col gap-6 rounded-[18px] bg-[var(--bg-2)] p-8 ${
                p.featured ? "border-[1.5px] border-[var(--accent)] shadow-[0_0_0_4px_var(--accent-soft)]" : "border border-[var(--border)]"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-[13px] py-1 text-xs font-semibold text-white">
                  Popüler
                </div>
              )}
              <div>
                <div className="mb-1.5 text-[1.05rem] font-semibold">{p.name}</div>
                <div className="text-[0.9rem] text-[var(--text-2)]">{p.blurb}</div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[2.6rem] font-semibold tracking-tight">{p.price}</span>
                <span className="text-[0.9rem] text-[var(--text-3)]">{p.unit}</span>
              </div>
              <Link
                href="/app"
                className={`rounded-[10px] py-[11px] text-center text-sm font-semibold transition ${
                  p.featured
                    ? "border border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-2)]"
                    : "border border-[var(--border-2)] bg-[var(--bg-3)] text-[var(--text)] hover:border-[var(--text-3)]"
                }`}
              >
                {p.cta}
              </Link>
              <div className="h-px bg-[var(--border)]" />
              <ul className="flex flex-col gap-3 text-[0.92rem] text-[var(--text-2)]">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="shrink-0 text-[var(--accent)]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-7 text-center text-[0.85rem] text-[var(--text-3)]">
          Fiyatlar yıllık faturalandırmada geçerlidir. KDV hariçtir.
        </p>
      </section>

      <section className="mx-auto max-w-[760px] px-6 pb-24 pt-[72px]">
        <h2 className="mb-8 text-center text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight">
          Sıkça sorulan sorular
        </h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-xl border border-[var(--border)] bg-[var(--bg-2)]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-5 py-[18px] text-base font-semibold outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-[var(--accent)] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="text-[1.3rem] leading-none text-[var(--text-3)] transition group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-[18px] text-[0.94rem] leading-relaxed text-[var(--text-2)]">{item.a}</div>
            </details>
          ))}
        </div>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
