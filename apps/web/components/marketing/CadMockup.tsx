/**
 * Hero'daki sahte CAD arayüzü (claude.ai/design): pencere çubuğu + araç çubuğu + tuval (kat planı SVG)
 * + işbirlikçi imleçleri + AI paneli. Saf görsel (etkileşim yok), tema değişkenleriyle açık/koyu uyumlu.
 */
export function CadMockup() {
  const toolIcon = { width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' } as const;
  // Dış genişlik/padding'i ebeveyn verir (hero sarmalı) → burada yalnız çerçeveli kart.
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 16,
        background: 'var(--bg-2)',
        boxShadow: '0 40px 120px -40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.01)',
        overflow: 'hidden',
      }}
    >
        {/* pencere çubuğu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ED6A5E' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F4BE4F' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#61C554' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '4px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 7 }}>
              Vesna — Kat-Plani.dwg
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-3)' }}>E</span>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ok)', color: '#fff', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-3)', marginLeft: -7 }}>M</span>
          </div>
        </div>
        {/* gövde */}
        <div style={{ display: 'flex', minHeight: 440 }}>
          {/* araç çubuğu */}
          <div style={{ width: 52, borderRight: '1px solid var(--border)', background: 'var(--bg-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
            <span style={{ ...toolIcon, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></svg>
            </span>
            {[
              <path key="a" d="M12 19l7-7 3 3-7 7-3-3z" />,
              <g key="b"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></g>,
              <g key="c"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M7 12h10" /></g>,
              <path key="d" d="M4 7V4h16v3M9 20h6M12 4v16" />,
            ].map((g, i) => (
              <span key={i} style={{ ...toolIcon, color: 'var(--text-3)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{g}</svg>
              </span>
            ))}
          </div>
          {/* tuval */}
          <div style={{ flex: 1, position: 'relative', background: 'var(--bg)', backgroundImage: 'linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px)', backgroundSize: '26px 26px', minWidth: 0 }}>
            <svg viewBox="0 0 560 400" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
              <line x1="48" y1="26" x2="512" y2="26" stroke="var(--accent)" strokeWidth="1" opacity="0.7" />
              <line x1="48" y1="22" x2="48" y2="30" stroke="var(--accent)" strokeWidth="1" opacity="0.7" />
              <line x1="512" y1="22" x2="512" y2="30" stroke="var(--accent)" strokeWidth="1" opacity="0.7" />
              <rect x="258" y="18" width="46" height="16" rx="3" fill="var(--bg-2)" stroke="var(--accent)" strokeWidth="0.8" opacity="0.95" />
              <text x="281" y="29.5" textAnchor="middle" fill="var(--accent)" fontFamily="Inter" fontSize="10" fontWeight="600">12.40 m</text>
              <rect x="48" y="44" width="256" height="200" fill="var(--accent-soft)" />
              <rect x="48" y="44" width="464" height="312" fill="none" stroke="var(--text-2)" strokeWidth="3.5" />
              <path d="M304 44 L304 244 M304 244 L512 244 M304 150 L380 150 M180 244 L180 356" fill="none" stroke="var(--text-2)" strokeWidth="3" />
              <path d="M304 200 A44 44 0 0 0 260 244" fill="none" stroke="var(--text-3)" strokeWidth="1.2" opacity="0.7" />
              <line x1="304" y1="200" x2="304" y2="244" stroke="var(--bg)" strokeWidth="4" />
              <g fill="var(--accent)"><rect x="44" y="40" width="8" height="8" /><rect x="300" y="40" width="8" height="8" /><rect x="44" y="240" width="8" height="8" /><rect x="300" y="240" width="8" height="8" /></g>
              <text x="176" y="142" textAnchor="middle" fill="var(--text)" fontFamily="Inter" fontSize="14" fontWeight="600">Salon</text>
              <text x="176" y="160" textAnchor="middle" fill="var(--accent)" fontFamily="Inter" fontSize="12" fontWeight="600">32.4 m²</text>
              <text x="408" y="92" textAnchor="middle" fill="var(--text-2)" fontFamily="Inter" fontSize="13" fontWeight="600">Yatak Odası</text>
              <text x="408" y="109" textAnchor="middle" fill="var(--text-3)" fontFamily="Inter" fontSize="11">16.0 m²</text>
              <text x="408" y="300" textAnchor="middle" fill="var(--text-2)" fontFamily="Inter" fontSize="13" fontWeight="600">Mutfak</text>
              <text x="408" y="317" textAnchor="middle" fill="var(--text-3)" fontFamily="Inter" fontSize="11">12.2 m²</text>
              <text x="114" y="304" textAnchor="middle" fill="var(--text-2)" fontFamily="Inter" fontSize="12" fontWeight="600">Hol</text>
            </svg>
            <Cursor left="38%" top="30%" color="var(--accent)" name="Elif" />
            <Cursor left="64%" top="58%" color="var(--ok)" name="Mert" />
          </div>
          {/* AI paneli */}
          <div style={{ width: 236, borderLeft: '1px solid var(--border)', background: 'var(--bg-3)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--accent)"><path d="M9.9 15.5A2 2 0 0 0 8.5 14L2.4 12.5a.5.5 0 0 1 0-1L8.5 10A2 2 0 0 0 9.9 8.5L11.5 2.4a.5.5 0 0 1 1 0L14 8.5a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1L15.5 14a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z" /></svg>
              Vesna Asistan
            </div>
            <div style={{ alignSelf: 'flex-end', maxWidth: '88%', background: 'var(--accent)', color: '#fff', fontSize: 12, padding: '8px 11px', borderRadius: '11px 11px 3px 11px', lineHeight: 1.45 }}>90 m² 3+1 daire planı öner</div>
            <div style={{ maxWidth: '92%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12, padding: '8px 11px', borderRadius: '11px 11px 11px 3px', lineHeight: 1.5 }}>
              3 oda + salon yerleşimi hazır. Islak hacimler tesisat şaftına yakın. <span style={{ color: 'var(--accent)' }}>TS 9111</span> erişilebilirlik notu eklendi.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 6 }}>Salon 32 m²</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 6 }}>3 Y. Odası</span>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--accent)' }}>
              <span className="v-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />Render üretiliyor…
            </div>
          </div>
        </div>
      </div>
  );
}

function Cursor({ left, top, color, name }: { left: string; top: string; color: string; name: string }) {
  return (
    <div style={{ position: 'absolute', left, top, display: 'flex', flexDirection: 'column', gap: 2, pointerEvents: 'none' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></svg>
      <span style={{ background: color, color: '#fff', fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 6, alignSelf: 'flex-start', marginLeft: 8 }}>{name}</span>
    </div>
  );
}
