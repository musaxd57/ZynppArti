/**
 * Supabase ortam değişkenleri (ADR-0047). ADDİTİF: anahtar yoksa `null` → uygulama anonim çalışır
 * (build/runtime kırılmaz). Yeni Supabase API anahtar formatı (`sb_publishable_…`) öncelikli; eski
 * `anon` JWT anahtarı yedek (her ikisi de `key` argümanı olarak geçerli).
 *
 * NOT: `NEXT_PUBLIC_*` değişkenleri Next tarafından BUILD anında gömülür → istemci paketinde okunur.
 * Public anahtar tarayıcıya gitmesi NORMAL — satır-düzeyi güvenlik (RLS) korur. Secret anahtar ASLA
 * burada değil (yalnız sunucu route'unda `process.env.SUPABASE_SECRET_KEY`).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase yapılandırılmış mı (URL + public anahtar var mı)? false → anonim mod. */
export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);
