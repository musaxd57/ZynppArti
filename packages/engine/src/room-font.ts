import { BitmapFont, TextStyle } from 'pixi.js';
import { ROOM_FONT, TR_CHARSET } from './charset';

let installed = false;

/**
 * Mahal etiket fontunu TR_CHARSET ile bir kez yükler. BitmapText atlası bu çağrıyla baştan
 * Türkçe karakterleri de içerir (I18N-TEXT.md — glyph tuzağını baştan kapatır).
 * app.init sonrası çağrılmalıdır (Pixi varsayılan renderer'ı gerekir).
 */
export function installRoomFont(): void {
  if (installed) return;
  installed = true;
  BitmapFont.install({
    name: ROOM_FONT,
    style: new TextStyle({ fontFamily: 'Arial', fontSize: 64, fill: 0xffffff }),
    chars: TR_CHARSET,
  });
}
