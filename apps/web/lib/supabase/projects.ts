import { getSupabaseBrowser } from './client';

/**
 * Bulut proje kalıcılığı (ADR-0047). Model = Storage'da tek JSON zarfı (CLAUDE §6.5 "model = blob");
 * `projects` tablosu yalnız metadata (ad + yol + tarih). RLS kullanıcıyı kendi projeleriyle sınırlar.
 *
 * Hepsi GİRİŞ ister (auth.uid). Anahtar yoksa / oturum yoksa anlamlı hata fırlatılır (UI yakalar).
 * `serializeModel`/`deserializeModel` (document) ile aynı zarf → yerel .json ile birebir uyumlu.
 */

const BUCKET = 'models';

export interface CloudProject {
  readonly id: string;
  readonly name: string;
  readonly updated_at: string;
  /** Proje sahibinin uid'si — oturum kullanıcısından farklıysa proje "paylaşılan"dır. */
  readonly owner?: string;
}

export interface ProjectMember {
  readonly member: string;
  readonly email: string;
  readonly role: string;
}

export interface Profile {
  readonly id: string;
  readonly email: string | null;
  readonly plan: string;
}

export type ShareResult = 'ok' | 'not_owner' | 'no_user' | 'self';

/** Oturum açmış kullanıcının id'si; yoksa anlamlı hata (giriş gerekli). */
async function requireUid(): Promise<{ supabase: NonNullable<ReturnType<typeof getSupabaseBrowser>>; uid: string }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Bulut yapılandırılmadı (giriş kapalı).');
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('Buluta kaydetmek için giriş yapmalısın.');
  return { supabase, uid };
}

/** Storage yolu: models/<uid>/<projectId>.json (RLS bu prefix'i kullanıcıya kilitler). */
function pathOf(uid: string, id: string): string {
  return `${uid}/${id}.json`;
}

/**
 * Modeli buluta kaydeder (varsa üzerine yazar). `id` verilmezse yeni proje (UUID) oluşturur.
 * Storage'a JSON yükler + `projects` satırını upsert eder. Kaydedilen proje id'sini döndürür.
 */
export async function saveProjectToCloud(opts: {
  id?: string;
  name: string;
  json: string;
}): Promise<{ id: string }> {
  const { supabase, uid } = await requireUid();
  const id = opts.id ?? crypto.randomUUID();
  const path = pathOf(uid, id);

  const up = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([opts.json], { type: 'application/json' }), {
      upsert: true,
      contentType: 'application/json',
    });
  if (up.error) throw up.error;

  const row = await supabase.from('projects').upsert({
    id,
    owner: uid,
    name: opts.name,
    storage_path: `${BUCKET}/${path}`,
    updated_at: new Date().toISOString(),
  });
  if (row.error) {
    // Metadata yazılamadı (RLS/constraint) → az önce yüklenen blob'u yetim bırakma: metadata satırı
    // olmayan blob listelenmez/açılmaz, tekrar denemelerde çöp birikir (denetim L13).
    if (!opts.id) {
      // Yeni proje → blob kesin yetim, best-effort sil.
      await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    } else {
      // Üzerine-yazma reddedildi: bu id bize ait OLMAYABİLİR (paylaşılan projeyi hedefledik, sahiplik
      // okunamamıştı) → blob kendi klasörümüzde yetim kalır. Sahip-satırın YOKLUĞU KESİNSE sil; sorgu
      // da hata verirse (transient) DOKUNMA — meşru üzerine-yazılan blob'u yanlışlıkla silmeyelim.
      const check = await supabase.from('projects').select('id').eq('id', id).eq('owner', uid).maybeSingle();
      if (!check.error && !check.data) await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    }
    throw row.error;
  }
  return { id };
}

/** Kullanıcının bulut projeleri (en son güncellenen önce). Oturum yoksa boş dizi. */
export async function listCloudProjects(): Promise<CloudProject[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from('projects')
    .select('id,name,updated_at,owner')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudProject[];
}

/** Oturum kullanıcısının id'si (paylaşılan/sahip ayrımı için); yoksa null. */
export async function currentUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Oturum kullanıcısının profili (plan göstergesi için). Oturum/anahtar yoksa null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from('profiles').select('id,email,plan').eq('id', uid).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? { id: uid, email: userData.user?.email ?? null, plan: 'free' };
}

/** Projeye e-posta ile üye ekler (yalnız sahip; RPC sahip kontrolü + uid çözümü yapar). */
export async function shareProject(projectId: string, email: string, role: string): Promise<ShareResult> {
  const { supabase } = await requireUid();
  const { data, error } = await supabase.rpc('share_project', {
    p_project: projectId,
    p_email: email,
    p_role: role,
  });
  if (error) throw error;
  return (data as ShareResult) ?? 'no_user';
}

/** Projenin üyelerini (e-posta + rol) listeler (yalnız sahip; RPC). */
export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { supabase } = await requireUid();
  const { data, error } = await supabase.rpc('list_project_members', { p_project: projectId });
  if (error) throw error;
  return (data as ProjectMember[]) ?? [];
}

/** Bir üyeyi projeden çıkarır (sahip; members_owner RLS politikası izin verir). */
export async function removeProjectMember(projectId: string, memberId: string): Promise<void> {
  const { supabase } = await requireUid();
  const { error } = await supabase.from('project_members').delete().eq('project', projectId).eq('member', memberId);
  if (error) throw error;
}

/**
 * Bir bulut projesinin JSON zarfını indirir (deserializeModel'e verilir). Yolu METADATA'daki
 * `storage_path`'ten okur (paylaşılan projede dosya SAHİBİN klasöründedir; çağıranın değil → kendi
 * uid'inden uydurmak 404 verirdi). storage_path yoksa kendi klasörüne düşer (geriye uyum). (Denetim.)
 */
export async function loadProjectFromCloud(id: string): Promise<string> {
  const { supabase, uid } = await requireUid();
  let path = pathOf(uid, id);
  const meta = await supabase.from('projects').select('storage_path').eq('id', id).maybeSingle();
  const sp = meta.data?.storage_path as string | undefined;
  if (sp) path = sp.startsWith(`${BUCKET}/`) ? sp.slice(BUCKET.length + 1) : sp;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  return await data.text();
}

/** Bir bulut projesini siler (Storage dosyası + metadata satırı). */
export async function deleteCloudProject(id: string): Promise<void> {
  const { supabase, uid } = await requireUid();
  await supabase.storage.from(BUCKET).remove([pathOf(uid, id)]);
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}
