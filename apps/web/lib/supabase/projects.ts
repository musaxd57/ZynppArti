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
}

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
  if (row.error) throw row.error;
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
    .select('id,name,updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudProject[];
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
