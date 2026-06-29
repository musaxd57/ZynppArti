'use client';

import { serializeModel, type EntityStore } from '@zynpparti/document';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { saveProjectToCloud, listCloudProjects, getProfile } from '@/lib/supabase/projects';
import { getCloudProjectId, setCloudProjectId } from '@/lib/cloud-project';
import { getProjectName } from '@/lib/project-name';
import { isPaidPlan, isAdminEmail, PLAN_QUOTAS } from '@/lib/plan';

/**
 * Tek bulut-kaydet yolu (ADR-0047). Ctrl+S, Toolbar "Kaydet" ve CloudMenu "Buluta kaydet" hepsi
 * BURAYI çağırır → davranış tek yerde, kopya kota mantığı yok. Modül fonksiyonu olduğu için React
 * kapanışına bağlı değil: ad/bağ/oturum hep taze okunur (Ctrl+S handler bir kez bağlansa bile doğru).
 */

export type CloudSaveResult =
  | { status: 'saved'; id: string; isNew: boolean; isCopy: boolean }
  /** Bulut kapalı (anahtar yok) ya da giriş yok → çağıran yerel .json indirmeye düşmeli. */
  | { status: 'unauthenticated' }
  /** Ücretsiz plan kotası doldu (toast'ı çağıran gösterir). */
  | { status: 'blocked'; message: string }
  /** Zaten bir kaydetme sürüyor → çağıran yok sayar (çift yeni-proje önlenir). */
  | { status: 'busy' }
  | { status: 'error'; message: string };

/** Aynı anda iki kaydetmeyi engeller (Ctrl+S spam'i yeni-proje çoğaltmasın — denetim M18). */
let saving = false;

/** Bulut açık + oturum var mı? (Ctrl+S yönlendirmesi + StartScreen listesi kararı için.) */
export async function isCloudSignedIn(): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getUser();
    return !!data.user;
  } catch {
    return false; // ağ/oturum hatası → giriş yok say (denetim M21)
  }
}

/**
 * Açık modeli buluta kaydeder. Bağlı bulut projesi varsa ÜZERİNE yazar; yoksa YENİ proje oluşturur
 * (ücretsiz planda sahip-olunan proje kotası kontrol edilir). `asNew` → bağ yok sayılır, her zaman yeni
 * proje ("Farklı kaydet" / paylaşılan projenin kendi kopyası). Giriş yoksa 'unauthenticated' döner.
 *
 * PAYLAŞILAN (başkasının) projeye ÜZERİNE YAZMAZ: kendi kopyanı oluşturur (denetim M13). Aksi halde
 * upsert ya sahibin satırını gaspederdi ya RLS'e takılıp çöp dosya bırakırdı.
 */
export async function saveCurrentToCloud(
  store: EntityStore,
  opts?: { asNew?: boolean },
): Promise<CloudSaveResult> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { status: 'unauthenticated' };

  if (saving) return { status: 'busy' };
  saving = true;
  try {
    let uid: string | undefined;
    try {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id;
    } catch {
      return { status: 'error', message: 'Oturum doğrulanamadı — bağlantını kontrol et.' };
    }
    if (!uid) return { status: 'unauthenticated' };

    const linkedId = opts?.asNew ? undefined : getCloudProjectId();
    let targetId = linkedId;
    let isCopy = false;

    // Bağlı proje BAŞKASINA mı ait? → üzerine yazma, kendi kopyanı oluştur (M13).
    if (targetId) {
      try {
        const { data: row } = await supabase
          .from('projects')
          .select('owner')
          .eq('id', targetId)
          .maybeSingle();
        const owner = (row as { owner?: string } | null)?.owner;
        if (owner && owner !== uid) {
          targetId = undefined;
          isCopy = true;
        }
      } catch {
        // Sahiplik okunamadıysa devam (upsert RLS'e takılırsa zaten error döner) — kapı sağlamlığı.
      }
    }

    // Yeni proje (veya paylaşılandan kopya) + ücretsiz plan → sahip-olunan proje kotası.
    if (!targetId) {
      try {
        const profile = await getProfile();
        // Admin e-posta veya ücretli plan → kota yok (sınırsız bulut proje).
        if (!isAdminEmail(profile?.email) && !isPaidPlan(profile?.plan ?? 'free')) {
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
        id: targetId,
        name: getProjectName(),
        json: serializeModel(store.all()),
      });
      setCloudProjectId(id);
      return { status: 'saved', id, isNew: !linkedId || isCopy, isCopy };
    } catch (err) {
      return { status: 'error', message: err instanceof Error ? err.message : 'Buluta kaydedilemedi.' };
    }
  } finally {
    saving = false;
  }
}
