// Mahal etiketleri için metin atlasına BAŞTAN katılan karakter seti (I18N-TEXT.md).
// Türkçe karakterler dahil → "ş görünmüyor" tuzağı (MSDF/BitmapText) yaşanmaz.

const ASCII =
  " !\"#$%&'()*+,-./0123456789:;<=>?@" +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`' +
  'abcdefghijklmnopqrstuvwxyz{|}~';

const TURKISH = 'çşğıİöüÇŞĞÖÜ';
const SYMBOLS = '²³°±×÷–—…«»€₺';

/** Mahal font atlasının kapsadığı tüm karakterler. */
export const TR_CHARSET = ASCII + TURKISH + SYMBOLS;

/** Mahal etiket fontunun (BitmapFont) adı. */
export const ROOM_FONT = 'room';
