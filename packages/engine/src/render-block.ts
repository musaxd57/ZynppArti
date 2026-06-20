import { Graphics } from 'pixi.js';
import type { Block } from '@zynpparti/document';
import { LINEWEIGHTS } from './lineweights';
import { drawBlockSymbol } from './block-symbols';

/**
 * Bloku (mobilya sembolü) çizer: Graphics konum/dönüşle yerleştirilir, sembol YEREL koordinatta
 * çizilir. Çizgi kalınlığı ekran-sabit (ince mobilya çizgisi); g dünya container'ının çocuğu
 * olduğundan yerel birim = dünya birimi (cm).
 */
export function drawBlock(g: Graphics, block: Block, pixelSize: number): void {
  g.clear();
  g.position.set(block.position.x, block.position.y);
  g.rotation = block.rotation;
  drawBlockSymbol(g, block.kind, LINEWEIGHTS.thin * pixelSize);
}
