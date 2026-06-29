import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Render yeteneklerini bildirir → istemci "Geometriyi koru" toggle'ını anahtar YOKKEN DISABLED gösterir
 * (env-gate, sıfır-maliyet sızdırmaz). Sağlayıcı ÇAĞIRMAZ; yalnız env'e bakar. Oturum şart: anonim'e
 * yapılandırma sızdırma (anon → ikisi de false). Hiç para/AI çağrısı yok.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const supabase = await getSupabaseServer();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) {
    return Response.json({ creative: false, preserve: false });
  }
  return Response.json({
    creative: !!process.env.OPENAI_API_KEY?.trim(),
    preserve: !!(process.env.REPLICATE_API_TOKEN?.trim() || process.env.FAL_KEY?.trim()),
    hd: !!process.env.RENDER_PRESERVE_HD_MODEL?.trim(),
  });
}
