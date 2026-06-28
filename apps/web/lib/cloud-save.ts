'use client';

import { serializeModel, type EntityStore } from '@zynpparti/document';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { saveProjectToCloud, listCloudProjects, getProfile } from '@/lib/supabase/projects';
import { getCloudProjectId, setCloudProjectId } from '@/lib/cloud-project';
import { getProjectName } from '@/lib/project-name';
import { isPaidPlan, PLAN_QUOTAS } from '@/lib/plan';

/**
 * Tek bulut-kaydet yolu (ADR-0047). Ctrl+S, Toolbar "Kaydet" ve CloudMenu "Buluta kaydet" hepsi
 * BURAYI çağırır → davranış tek yerde, kopya kota mantığı yok. Modül fonksiyonu olduğu için React
 * kapanışına bağlı değil: ad/bağ/oturum hep taze okunur (Ctrl+S handler bir kez bağlansa bile doğru).
 */

export type CloudSaveResult =
  | { status: 'saved'; id: string; isNew: boolean }
  /** Bulut kapalı (anahtar yok) ya da giriş yok → çağıran yerel .json indirmeye düşmeli. */
  | { status: 'unauthenticated' }
  /** Ücretsiz plan kotası doldu (toast'ı çağıran gösterir). */
  | { status: 'blocked'; message: string }
  | { status: 'error'; message: string };

/** Bulut açık + oturum var mı? (Ctrl+S yönlendirmesi + StartScreen listesi kararı için.) */
export async function isCloudSignedIn(): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;
  const { data } = await supabase.auth.getUser();
  return !!data.user;
}

/**
 * Açık modeli buluta kaydeder. Bağlı bulut projesi varsa ÜZERİNE yazar; yoksa YENİ proje oluşturur
 * (ücretsiz planda sahip-olunan proje kotası kontrol edilir). `asNew` → bağ yok sayılır, her zaman yeni
 * proje ("Farklı kaydet" / paylaşılan projenin kendi kopyası). Giriş yoksa 'unauthenticated' döner.
 */
export async function saveCurrentToCloud(
  store: EntityStore,
  opts?: { asNew?: boolean },
): Promise<CloudSaveResult> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { status: 'unauthenticated' };
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return { status: 'unauthenticated' };

  const currentId = opts?.asNew ? undefined : getCloudProjectId();

  // Yeni proje + ücretsiz plan → sahip-olunan proje kotası. Üzerine-yazma bu kapıdan geçmez.
  if (!currentId) {
    try {
      const profile = await getProfile();
      if (!isPaidPlan(profile?.plan ?? 'free')) {
        const list = await listCloudProjects();
        const owned = list.filter((p) => !p.owner || p.owner === uid).length;
        const cap = PLAN_QUOTAS.free.cloudProjects;
        if (owned >= cap) {
          return {
            status: 'blocked',
            message: `Ücretsiz planda en fazla ${cap} bulut proje saklayabilirsin. Daha fazlası için Pro'ya geç.`,
          };
        }
      }
    } catch {
      // Kota kontrolü başarısızsa kullanıcıyı engelleme (kapı sağlamlığı) — kaydetmeye devam.
    }
  }

  try {
    const { id } = await saveProjectToCloud({
      id: currentId,
      name: getProjectName(),
      json: serializeModel(store.all()),
    });
    setCloudProjectId(id);
    return { status: 'saved', id, isNew: !currentId };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Buluta kaydedilemedi.' };
  }
}
