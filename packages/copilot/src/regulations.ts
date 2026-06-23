/**
 * Türkçe yönetmelik tohumu (Faz 2, ADR-0015/0018). Premium farklılaştırıcı: piyasadaki kod
 * copilot'ları ABD odaklı; Türk yönetmeliği bilen copilot kimsede yok denecek kadar az.
 *
 * Bu bir **bilgi tabanı tohumudur** — yüksek-değerli, atıflı kurallar. İleride genişler
 * (İmar/TBDY/Otopark/TS 9111 tam kapsam). Kalite tavanı yok (ADR-0019): kurallar büyür.
 *
 * İki grup var:
 *  - **Aktif denetlenen:** mevcut veriyle (duvar + mahal + alan) çalışır → `checks.ts` kullanır.
 *  - **Tohum (denetimi veri bekleyen):** kural + atıf hazır ama denetim için yeni entity gerekir
 *    (çekme → parsel sınırı; kapı genişliği → Opening entity). Geldiğinde denetim aktifleşir.
 *
 * UYARI: Değerler bilgilendirme amaçlıdır; yürürlükteki mevzuat (plan notları, bölge, kullanım)
 * değişebilir. Resmî projede güncel yönetmelikten doğrulanmalıdır (copilot Seviye 1 — öneri verir,
 * sorumluluğu üstlenmez; AI-AGENT-VISION §2).
 */

export interface Regulation {
  /** Kararlı anahtar (kod içi referans). */
  readonly id: string;
  /** Atıf kaynağı — kullanıcıya gösterilir (ör. "TS 9111"). */
  readonly source: string;
  /** İnsan-okur kısa kural ifadesi (Türkçe). */
  readonly rule: string;
}

/** Minimum eşik içeren kurallar için sayısal limit + birim taşıyan tip. */
export interface ThresholdRegulation extends Regulation {
  /** Asgari değer (iç birim: cm veya m²; `unit` belirtir). */
  readonly min: number;
  readonly unit: 'cm' | 'm2';
  /**
   * Denetim durumu: 'active' = mevcut veriyle çalışır; 'pending' = denetim için yeni entity
   * gerekiyor (çekme/kapı), kural yine de atıflı bilgi tabanında. (ADR-0018.)
   */
  readonly status: 'active' | 'pending';
}

export const REGULATIONS = {
  // ---- Aktif denetlenen (duvar + mahal + alan ile) ----
  corridorWidth: {
    id: 'ts9111-corridor-width',
    source: 'TS 9111',
    rule: 'Erişilebilir koridor net genişliği en az 120 cm olmalı.',
    min: 120,
    unit: 'cm',
    status: 'active',
  },
  bedroomMinArea: {
    id: 'imar-bedroom-min-area',
    source: 'Planlı Alanlar İmar Yönetmeliği (m.29)',
    rule: 'Yatak odası net alanı en az 9,0 m² olmalı.',
    min: 9,
    unit: 'm2',
    status: 'active',
  },
  livingMinArea: {
    id: 'imar-living-min-area',
    source: 'Planlı Alanlar İmar Yönetmeliği (m.29)',
    rule: 'Oturma odası net alanı en az 12,0 m² olmalı.',
    min: 12,
    unit: 'm2',
    status: 'active',
  },
  kitchenMinArea: {
    id: 'imar-kitchen-min-area',
    source: 'Planlı Alanlar İmar Yönetmeliği (m.29)',
    rule: 'Mutfak (yemek pişirme yeri) net alanı en az 3,3 m² olmalı.',
    min: 3.3,
    unit: 'm2',
    status: 'active',
  },
  roomMinWidth: {
    id: 'imar-room-min-width',
    source: 'Planlı Alanlar İmar Yönetmeliği (m.29)',
    // Yaşanabilir oda en küçük net genişliği; tam değer plana/sürüme göre değişir → info.
    rule: 'Konutta yaşanabilir oda en küçük net genişliği genelde en az 2,10 m (plana göre değişebilir).',
    min: 210,
    unit: 'cm',
    status: 'active',
  },
  bathroomTurning: {
    id: 'ts9111-bathroom-turning',
    source: 'TS 9111',
    rule: 'Erişilebilir ıslak hacimde en az 150 cm çapında dönüş alanı bulunmalı.',
    min: 150,
    unit: 'cm',
    status: 'active',
  },
  bathroomMinArea: {
    id: 'imar-bathroom-min-area',
    source: 'Planlı Alanlar İmar Yönetmeliği (m.29)',
    // İmar m.29 banyo için net-alan değil DAR KENAR min 1,50 m verir → 1,5×1,5 ≈ 2,25 m² efektif taban.
    rule: 'Banyo dar kenarı en az 1,50 m olmalı (≈2,25 m² efektif; plana göre değişebilir).',
    min: 2.25,
    unit: 'm2',
    status: 'active',
  },

  ceilingHeight: {
    id: 'imar-ceiling-height',
    source: 'Planlı Alanlar İmar Yönetmeliği (m.28)',
    // İmar m.28: iskan edilen kat net yüksekliği en az 2,60 m (2,40 m yalnız istisnai hallerde).
    rule: 'Konutta iskan edilen kat net yüksekliği en az 2,60 m olmalı (istisnai hallerde 2,40 m).',
    min: 260,
    unit: 'cm',
    status: 'active',
  },

  doorClearWidth: {
    id: 'ts9111-door-clear-width',
    source: 'TS 9111',
    rule: 'Erişilebilir kapı net geçiş genişliği en az 90 cm olmalı.',
    min: 90,
    unit: 'cm',
    status: 'active', // Opening (kapı) entity eklendi → denetim aktif
  },

  // ---- Tohum: atıflı bilgi tabanı; denetim veri (yeni entity) bekliyor ----
  setbackFront: {
    id: 'imar-setback-front',
    source: 'Planlı Alanlar İmar Yönetmeliği (m.5)',
    rule: 'Ön bahçe çekme mesafesi genelde en az 5,0 m (imar planına göre değişir).',
    min: 500,
    unit: 'cm',
    status: 'pending', // Parsel/ada sınırı entity'si gelince aktifleşir
  },
  setbackSide: {
    id: 'imar-setback-side',
    source: 'Planlı Alanlar İmar Yönetmeliği (m.5)',
    rule: 'Yapının parsel sınırına çekme mesafesi genelde en az 3,0 m (ön/arka için plana göre daha fazla).',
    min: 300,
    unit: 'cm',
    status: 'active', // Parcel entity eklendi → çekme denetimi aktif (asgari/yan ölçütü)
  },
} satisfies Record<string, ThresholdRegulation>;

/**
 * Otopark ihtiyacı (Otopark Yönetmeliği) — gerçek ihtiyaç kullanım + bölge + nüfusa göre
 * belirlenir; bu KABA bir alan-bazlı tahmindir (basitleştirilmiş tohum). Bilgi amaçlı.
 */
export const PARKING_REGULATION = {
  id: 'otopark-area-ratio',
  source: 'Otopark Yönetmeliği (2018, m.8/Ek-1)',
  // Gerçek kural DAİRE BÜYÜKLÜĞÜ bracket'ine göredir (alan-orantılı değil); bu yalnız kaba bir tahmin.
  rule: 'Otopark ihtiyacı daire büyüklüğüne göre belirlenir (Ek-1); bu kaba tahmin: her ~100 m² için ~1 otopark.',
  /** Bir otopark başına yaklaşık yapı alanı (m²). */
  areaPerSpaceM2: 100,
} as const;

/**
 * TAKS (taban alanı katsayısı) — bina taban alanı / parsel alanı (İmar). Gerçek üst sınır imar
 * planı/bölgeye göre değişir; tipik konut değeri ~0,40. Taban alanı tek-kat varsayımıyla mahal
 * alanları toplamından KABA tahmin edilir (duvar kalınlığı hariç). Bilgi amaçlı (ADR-0021).
 */
export const TAKS_REGULATION = {
  id: 'imar-taks',
  source: 'Planlı Alanlar İmar Yönetmeliği',
  rule: 'TAKS (taban/parsel) üst sınırı imar planına göredir; konutta tipik üst sınır ~%40.',
  typicalMax: 0.4,
} as const;

/**
 * Doğal aydınlatma (Planlı Alanlar İmar Yönetmeliği) — yaşam mahallerinde pencere alanı taban
 * alanının ~1/10'undan az olmamalı. Pencere yüksekliği planda saklanmadığından KABA tahmindir;
 * bina düzeyinde toplam oran bakılır (mahal-pencere eşleşmesi yok). Bilgi/uyarı amaçlı.
 */
export const DAYLIGHT_REGULATION = {
  id: 'imar-daylight-ratio',
  // NOT: 1/10 oranı güncel İmar Yönetmeliği'nde NİCEL olarak yer almaz → "iyi pratik" referansı.
  source: 'İyi pratik (referans; yönetmelik nicel oran vermez)',
  rule: "Yaşam mahallerinde pencere alanı taban alanının ~1/10'undan az olmamalı (iyi pratik).",
  minRatio: 0.1,
  /** Pencere yükseklik varsayımı (cm) — alan tahmini için. */
  windowHeightCm: 140,
} as const;

/**
 * Mahal başına doğal aydınlatma/havalandırma (İmar) — yaşam mahalleri (oturma/yatma/mutfak)
 * en az bir pencereye sahip olmalı. `DAYLIGHT_REGULATION` bina düzeyinde oran bakar; bu kural
 * mahal-pencere EŞLEŞMESİ yapar (pencere odanın çevre duvarında mı?). Bilgi/advisory (kaba eşleşme).
 */
export const ROOM_DAYLIGHT_REGULATION = {
  id: 'imar-room-daylight',
  source: 'Planlı Alanlar İmar Yönetmeliği (m.29)',
  rule: 'Yaşam mahalleri (oturma/yatma/mutfak) doğal ışık ve havalandırma için en az bir pencere almalı.',
} as const;

/**
 * Islak hacim havalandırması (İmar) — banyo/WC gibi ıslak hacimlerde doğal havalandırma (pencere)
 * yoksa mekanik havalandırma (aspiratör/şönt) gerekir. Pencere-mahal eşleşmesiyle (kaba) denetlenir;
 * penceresiz ıslak hacim için advisory bulgu (mekanik olabilir → info, hata değil).
 */
export const WET_VENTILATION_REGULATION = {
  id: 'imar-wet-ventilation',
  source: 'Planlı Alanlar İmar Yönetmeliği (m.30)',
  rule: 'Islak hacimler (banyo/WC) doğal (pencere) veya mekanik havalandırmaya sahip olmalı.',
} as const;

/**
 * Yapının parsel içinde kalması (İmar) — eşiksiz kural (geometrik içerme). Çekme mesafeleri
 * `setbackSide` ile ayrıca denetlenir; bu kural duvarların parsel sınırının dışına taşmasını yakalar.
 */
export const PARCEL_CONTAINMENT_REGULATION = {
  id: 'imar-parcel-containment',
  source: 'Planlı Alanlar İmar Yönetmeliği',
  rule: 'Yapı parsel sınırları içinde kalmalı (çekme mesafeleri saklıdır).',
} as const;

/** Bir kuralın "Kaynak — kural" biçiminde atıf metni. */
export function citationOf(reg: Regulation): string {
  return `${reg.source} — ${reg.rule}`;
}

/** Bilgi tabanındaki tüm eşik kuralları (referans paneli / dokümantasyon için). */
export function allRegulations(): ThresholdRegulation[] {
  return Object.values(REGULATIONS);
}
