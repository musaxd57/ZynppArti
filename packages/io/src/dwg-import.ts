import { importDxf, type DxfImportResult } from './dxf-import';

/**
 * DWG içe aktarma (Faz 1 — CLAUDE §8.4). Tarayıcıda WASM (`@mlightcad/libredwg-web`) ile DWG'yi
 * DXF'e çevirir, sonra mevcut DXF import hattını (LINE/POLYLINE/ARC/CIRCLE/TEXT/INSERT) kullanır →
 * tek yerde tutarlı geometri. WASM ağır (~9 MB) olduğu için sağlayıcı **dinamik import** edilir
 * (yalnız DWG yüklenince yüklenir, ana paketi şişirmez).
 *
 * `create(dir)` wasm dizinidir; kütüphane URL'i `` `${dir}/libredwg-web.wasm` `` diye kurar. Tarayıcıda
 * dizin **boş string** olmalı → `/libredwg-web.wasm` (apps/web/public kökünden servis). DİKKAT: `'/'`
 * verilirse `//libredwg-web.wasm` (protocol-relative) olur ve tarayıcıda kırılır — Node'da fs `//`'i
 * düzelttiği için bu hata Node testinde gizlenir; tarayıcıda mutlaka boş string kullan.
 */
const WASM_DIR = '';

/**
 * @param wasmDir wasm dosyasının bulunduğu dizin. Tarayıcıda **boş string** (apps/web/public
 *   kökünden `/libredwg-web.wasm`). Node/sunucu (veya test) için node_modules'taki gerçek `wasm/`
 *   dizini verilmeli — yoksa kütüphane FS kökünde `libredwg-web.wasm` arar ve patlar.
 */
export async function importDwg(content: ArrayBuffer, wasmDir: string = WASM_DIR): Promise<DxfImportResult> {
  const { LibreDwg } = await import('@mlightcad/libredwg-web');
  const lib = await LibreDwg.create(wasmDir);
  const dxf = lib.dwg_write_dxf(content);
  if (!dxf) throw new Error('DWG çözülemedi (dönüşüm boş döndü).');
  const text = typeof dxf === 'string' ? dxf : new TextDecoder().decode(dxf);
  return importDxf(text);
}
