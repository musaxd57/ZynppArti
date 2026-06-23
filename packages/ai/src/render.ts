import OpenAI from 'openai';

/**
 * AI Render (Faz 2C) — plandan/tariften fotogerçekçi mimari görsel. v1: OpenAI görsel API'si
 * (kullanıcının mevcut anahtarı). "Yaratıcı + program-farkında" mod: istemci, kullanıcının
 * atmosfer tarifine projedeki oda/m² özetini ekler → render tasarımı yansıtır.
 *
 * NOT: Tam "geometriyi koru" (ControlNet, plan kenarlarına birebir bağlı) ayrı bir difüzyon
 * sağlayıcısı (Replicate/Fal) ister — sonraki adım (FAZ2-NOTES §1). Bu v1 kompozisyonu birebir
 * korumaz; atmosfer/malzeme/ışık için güçlüdür. Maliyet: görsel başına düşük sentler mertebesi.
 */

/** OpenAI görsel modeli (en güncel). Erişim yoksa `OPENAI_IMAGE_MODEL=dall-e-3` ile değiştirilebilir. */
export const OPENAI_IMAGE_MODEL = 'gpt-image-1';

/**
 * Bir görsel üretir ve gösterilebilir bir kaynağa (data-URL veya http URL) çevirir.
 * gpt-image-1 base64 döndürür; dall-e-3 URL döndürür → ikisini de destekler.
 */
export async function renderImage(
  apiKey: string,
  prompt: string,
  model: string = OPENAI_IMAGE_MODEL,
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const res = await client.images.generate({ model, prompt, size: '1024x1024' });
  const first = res.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return first.url;
  throw new Error('Görsel üretilemedi (boş yanıt).');
}
