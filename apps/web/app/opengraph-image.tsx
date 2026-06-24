import { ImageResponse } from 'next/og';

/** Sosyal medya paylaşım görseli (OG/Twitter). Kod-üretimli, marka uyumlu. 1200×630. */
export const runtime = 'edge';
export const alt = 'Vesna — Tarayıcıda mimari tasarım, m² otomasyonu ve yapay zekâ';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg,#0b0b12 0%,#14121f 60%,#1b1733 100%)',
          color: '#f4f4f8',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#5B5BD6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 32 32" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 13 L7 7 L13 7" />
              <path d="M25 19 L25 25 L19 25" />
              <rect x="13" y="13" width="6" height="6" rx="1.2" fill="#fff" stroke="none" />
            </svg>
          </div>
          <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>Vesna</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 1000 }}>
            Mimari tasarımı çiz, hesapla ve{' '}
            <span style={{ color: '#8a87f5' }}>yapay zekâ</span> ile üret.
          </div>
          <div style={{ fontSize: 28, color: '#a6a6b4', maxWidth: 920 }}>
            Tarayıcıda çalışan çizim · otomatik mahal & m² · Türkçe yönetmelik asistanı · plan & render
          </div>
        </div>

        <div style={{ fontSize: 24, color: '#6c6c7a' }}>vesna.design</div>
      </div>
    ),
    size,
  );
}
