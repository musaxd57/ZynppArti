/**
 * Türkçe yönetmelik tohumu (Faz 2, ADR-0015). Premium farklılaştırıcı: piyasadaki kod
 * copilot'ları ABD odaklı; Türk yönetmeliği bilen copilot kimsede yok denecek kadar az.
 *
 * Bu yalnız TOHUM'dur — birkaç yüksek-değerli, doğrulanabilir kural. İleride genişler
 * (İmar/TBDY/Otopark/TS 9111 tam kapsam). Her kural ATIFLI olmalı (palavra değil; FAZ2-NOTES §2a).
 *
 * UYARI: Değerler bilgilendirme amaçlıdır; yürürlükteki mevzuat değişebilir. Resmî projede
 * güncel yönetmelikten doğrulanmalıdır. (Copilot öneri verir, sorumluluğu üstlenmez — Seviye 1.)
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
}

export const REGULATIONS = {
  corridorWidth: {
    id: 'ts9111-corridor-width',
    source: 'TS 9111',
    rule: 'Erişilebilir koridor net genişliği en az 120 cm olmalı.',
    min: 120,
    unit: 'cm',
  },
  bedroomMinArea: {
    id: 'imar-bedroom-min-area',
    source: 'Planlı Alanlar İmar Yönetmeliği',
    rule: 'Yatak odası net alanı en az 9,0 m² olmalı.',
    min: 9,
    unit: 'm2',
  },
  livingMinArea: {
    id: 'imar-living-min-area',
    source: 'Planlı Alanlar İmar Yönetmeliği',
    rule: 'Oturma odası net alanı en az 12,0 m² olmalı.',
    min: 12,
    unit: 'm2',
  },
} satisfies Record<string, ThresholdRegulation>;

/** Bir kuralın "Kaynak — kural" biçiminde atıf metni. */
export function citationOf(reg: Regulation): string {
  return `${reg.source} — ${reg.rule}`;
}
