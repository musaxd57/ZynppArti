/**
 * Plan modeli (ADR-0047 / Paddle, ADR-0046). Tek doğruluk kaynağı: plan adları, etiketleri ve kotaları.
 * Kota DEĞERLERİ burada tanımlı ama ENFORCEMENT (zorlama) henüz YOK — ücretsiz kullanıcıları kilitlemek
 * ürün/iş kararıdır (Moses). Paddle canlıya geçince kapı mantığı buraya dayanır.
 */

export type Plan = 'free' | 'pro' | 'studio';

export const PLAN_LABEL: Record<Plan, string> = {
  free: 'Ücretsiz',
  pro: 'Pro',
  studio: 'Studio',
};

/** Plan kotaları — `Infinity` = sınırsız. (fiyatlandirma sayfasıyla tutarlı: ücretsiz "3 aktif proje".) */
export interface PlanQuota {
  /** Eşzamanlı bulut proje sayısı. */
  readonly cloudProjects: number;
  /** Gerçek-zamanlı işbirlikçi sayısı (oda başı). */
  readonly collaborators: number;
  /** Aylık AI render kotası (0 = kapalı). */
  readonly aiRendersPerMonth: number;
}

export const PLAN_QUOTAS: Record<Plan, PlanQuota> = {
  free: { cloudProjects: 3, collaborators: 1, aiRendersPerMonth: 0 },
  pro: { cloudProjects: Infinity, collaborators: 5, aiRendersPerMonth: 100 },
  studio: { cloudProjects: Infinity, collaborators: Infinity, aiRendersPerMonth: 500 },
};

/** Geçerli plan mı? Bilinmeyen değer 'free'e düşer (güvenli varsayılan). */
export function normalizePlan(value: string | null | undefined): Plan {
  return value === 'pro' || value === 'studio' ? value : 'free';
}

/** Ücretli plan mı (Pro/Studio)? */
export function isPaidPlan(plan: string | null | undefined): boolean {
  const p = normalizePlan(plan);
  return p === 'pro' || p === 'studio';
}
