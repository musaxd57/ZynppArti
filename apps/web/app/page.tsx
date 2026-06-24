import Link from "next/link";
import Reveal from "@/components/marketing/Reveal";
import Marquee from "@/components/marketing/Marquee";
import HeroMockup from "@/components/marketing/HeroMockup";
import PlanGenerator from "@/components/marketing/PlanGenerator";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import Workflow from "@/components/marketing/Workflow";
import BeforeAfter from "@/components/marketing/BeforeAfter";
import type { Metadata } from "next";
import { Image as ImageIcon, Globe, BookOpen, Box, Shield } from "@/components/marketing/Icons";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { DemoVideo } from "@/components/marketing/DemoVideo";
import { RoomRedirect } from "@/components/RoomRedirect";

export const metadata: Metadata = {
  title: "Vesna — Tarayıcıda mimari tasarım, m² otomasyonu ve yapay zekâ",
  description:
    "Vesna; tarayıcıda çalışan gerçek zamanlı işbirlikçi mimari çizim, otomatik mahal & m² hesabı, Türkçe yönetmelik asistanı ve AI plan/render platformu.",
};

// Demo videosu. Boşken DemoVideo dürüst "yakında" gösterir (sahte oynat düğmesi yok).
// Video hazır olunca: '/videos/demo.mp4' (+ poster) — docs/VIDEO-PLAN.md.
const DEMO_VIDEO = "";
const DEMO_POSTER = "";

const WHY = [
  { Icon: Globe, title: "Kurulum yok, her yerde", desc: "Tarayıcıda açılır; indirme, lisans ve kurulum derdi yok. Mac, Windows, tablet — fark etmez." },
  { Icon: BookOpen, title: "Türkiye'ye özel zekâ", desc: "İmar yönetmeliği, TBDY ve TS 9111 bilen; kaynak gösteren Türkçe asistan." },
  { Icon: Box, title: "Çiz + hesapla + üret tek yerde", desc: "Çizim, mahal/m² otomasyonu ve AI üretim aynı tuvalde; araç değiştirmeden." },
  { Icon: Shield, title: "Verin sende kalır", desc: "Projeleriniz size ait. Şeffaf gizlilik, dışa aktarma her zaman elinizde." },
];

export default function HomePage() {
  return (
    <>
    <RoomRedirect />
    <SiteHeader />
    <main className="v-page">
      {/* HERO */}
      <section className="relative overflow-hidden px-6">
        <div className="v-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_40%,transparent_100%)]" style={{ backgroundSize: "48px 48px" }} />
        <div
          className="pointer-events-none absolute left-1/2 top-[-120px] h-[420px] w-[680px] -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse at center, var(--accent-soft), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-[880px] pb-14 pt-[88px] text-center">
          <Link
            href="/fiyatlandirma"
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-2)] px-[13px] py-1.5 text-[13px] text-[var(--text-2)] transition hover:border-[var(--border-2)] hover:text-[var(--text)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Türkçe yönetmelik asistanı — artık canlı
            <span className="text-[var(--text-3)]">→</span>
          </Link>
          <h1 className="mb-[22px] text-[clamp(2.3rem,5.4vw,4rem)] font-semibold leading-[1.04] tracking-[-0.035em]">
            Mimari tasarımı çiz, hesapla ve
            <br />
            <span className="text-[var(--accent)]">yapay zekâ</span> ile üret.
          </h1>
          <p className="mx-auto mb-[34px] max-w-[640px] text-[clamp(1.02rem,1.6vw,1.22rem)] leading-relaxed text-[var(--text-2)] [text-wrap:pretty]">
            Vesna; tarayıcıda çalışan, gerçek zamanlı işbirlikçi bir çizim, mahal/m² otomasyonu ve yapay zekâ
            tasarım asistanı platformudur. DWG/DXF aç, mahalleri otomatik bul, Türkçe yönetmeliğe danış, tariften
            plan üret.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/app" className="inline-flex items-center gap-2 rounded-[11px] border border-[var(--accent)] bg-[var(--accent)] px-[22px] py-[13px] text-[15px] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--accent-2)]">
              Hemen Başla — Ücretsiz
            </Link>
            <Link href="/#ozellikler" className="inline-flex items-center gap-2 rounded-[11px] border border-[var(--border-2)] bg-[var(--bg-2)] px-[22px] py-[13px] text-[15px] font-semibold text-[var(--text)] transition hover:border-[var(--text-3)]">
              Özellikleri gör
            </Link>
          </div>
        </div>
        <HeroMockup />
      </section>

      <Marquee />

      {/* AI PLAN ÜRETECİ */}
      <section className="mx-auto max-w-[1160px] px-6 pb-20 pt-24">
        <Reveal className="mx-auto mb-11 max-w-[660px] text-center">
          <div className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">Tariften plana</div>
          <h2 className="mb-3.5 text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-tight">
            Yaz, &quot;Üret&quot;e bas — plan çizilsin.
          </h2>
          <p className="text-[1.05rem] leading-relaxed text-[var(--text-2)]">
            Bir cümleyle tarif et; Vesna, yönetmeliğe uyumlu yerleşim alternatiflerini saniyeler içinde önersin. Hepsi düzenlenebilir.
          </p>
        </Reveal>
        <PlanGenerator />
      </section>

      <FeatureGrid />
      <Workflow />

      {/* PLAN → RENDER */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-[1160px] px-6 py-[90px]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-12">
            <Reveal>
              <div className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">Plandan render&apos;a</div>
              <h2 className="mb-4 text-[clamp(1.7rem,3.2vw,2.4rem)] font-semibold leading-[1.12] tracking-tight">
                Çizgi plan, fotogerçekçi görsele dönüşsün.
              </h2>
              <p className="mb-5 text-[1.02rem] leading-relaxed text-[var(--text-2)]">
                Atmosfer, malzeme ve ışığı tarif et; Vesna planından sunuma hazır görsel üretsin. Karşılaştırmak için kaydırıcıyı sürükle.
              </p>
              <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[0.85rem] text-[var(--text-3)]">
                <ImageIcon width={14} height={14} />
                İki katmana kendi plan &amp; render görselini verebilirsin
              </div>
            </Reveal>
            <Reveal delay={100}>
              <BeforeAfter />
            </Reveal>
          </div>
        </div>
      </section>

      {/* DEMO VIDEO */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1000px] px-6 py-[90px] text-center">
          <Reveal className="mx-auto max-w-[600px]">
            <div className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">2 dakikada</div>
            <h2 className="mb-3.5 text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-tight">
              Vesna&apos;yı iş başında izle.
            </h2>
            <p className="text-[1.05rem] leading-relaxed text-[var(--text-2)]">
              DWG açmaktan AI render&apos;a kadar tüm akış, tek bir tarayıcı sekmesinde.
            </p>
          </Reveal>
          <Reveal delay={100} className="mt-10">
            {/* Video YOKKEN dürüst "yakında" gösterir (sahte oynat düğmesi yok). Video gelince DEMO_VIDEO'yu doldur. */}
            <DemoVideo mode="player" src={DEMO_VIDEO || undefined} poster={DEMO_POSTER || undefined} label="Vesna ürün demosu" />
          </Reveal>
        </div>
      </section>

      {/* NEDEN VESNA */}
      <section className="border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto max-w-[1160px] px-6 py-20">
          <Reveal className="mb-11 max-w-[620px]">
            <div className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">Neden Vesna</div>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-tight">
              Türkiyeli mimarın işine göre tasarlandı.
            </h2>
          </Reveal>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={i * 80} className="rounded-[15px] border border-[var(--border)] bg-[var(--bg-2)] p-[26px] shadow-[inset_0_1px_0_var(--hi)]">
                <div className="mb-[18px] flex h-10 w-10 items-center justify-center rounded-[11px] bg-[var(--accent-soft)] text-[var(--accent)]">
                  <w.Icon width={20} height={20} />
                </div>
                <h3 className="mb-2 text-[1.08rem] font-semibold tracking-tight">{w.title}</h3>
                <p className="text-[0.92rem] leading-relaxed text-[var(--text-2)]">{w.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ALT CTA */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-[1160px] px-6 py-6">
          <div className="relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-2)] px-8 py-[72px] text-center">
            <div className="v-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_80%_at_50%_50%,#000,transparent)]" style={{ backgroundSize: "40px 40px" }} />
            <div className="relative">
              <h2 className="mb-4 text-[clamp(1.8rem,3.6vw,2.7rem)] font-semibold leading-[1.1] tracking-tight">
                İlk planını bugün üret.
              </h2>
              <p className="mx-auto mb-[30px] max-w-[520px] text-[1.05rem] leading-relaxed text-[var(--text-2)]">
                Ücretsiz başla, kredi kartı gerekmez. Dosyanı aç ve birkaç dakikada mahal listeni çıkar.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/app" className="inline-flex items-center gap-2 rounded-[11px] border border-[var(--accent)] bg-[var(--accent)] px-[22px] py-[13px] text-[15px] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--accent-2)]">
                  Hemen Başla — Ücretsiz
                </Link>
                <Link href="/fiyatlandirma" className="inline-flex items-center gap-2 rounded-[11px] border border-[var(--border-2)] bg-transparent px-[22px] py-[13px] text-[15px] font-semibold text-[var(--text)] transition hover:border-[var(--text-3)]">
                  Planları gör
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
