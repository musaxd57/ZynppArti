import { BitmapText, Container, Graphics } from 'pixi.js';
import type { SectionLine } from '@zynpparti/document';
import { ROOM_FONT } from './charset';

/** Kesit düzlemi rengi (turuncu) — SectionTool önizlemesiyle aynı. */
export const SECTION_COLOR = 0xff7a59;

const LABEL_SIZE = 18; // hedef ekran-px boyut (scale = pixelSize ile ekran-sabit kalır)
const LABEL_OFFSET = 42; // ekran-px — etiketin çizgiye dik kaçıklığı (görüş yönü tarafında)

/**
 * Kalıcı kesit işaretini çizer (ADR-0039): kesim çizgisi + her iki uçta görüş yönünü gösteren
 * dik ok bayrakları. Konturlar/oklar ekran-sabit (pixelSize ile ölçeklenir) → zoom'da şişmez
 * (mimari kesit gösterimi konvansiyonu, VISUAL-CRAFT). Etiketler ayrıdır (`buildSectionLabels`).
 */
export function drawSection(g: Graphics, s: SectionLine, pixelSize: number): void {
  g.clear();
  const { a, b } = s;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const nx = -uy; // çizgiye dik (görüş yönü tarafı)
  const ny = ux;
  const w = 1.5 * pixelSize;
  const arm = 26 * pixelSize; // uç bayrak uzunluğu
  const head = 11 * pixelSize; // ok ucu boyu

  // Ana kesim çizgisi.
  g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: w, color: SECTION_COLOR, alpha: 0.95 });

  // Her uçta dik bayrak + ok ucu (+normal yönüne bakar).
  for (const p of [a, b]) {
    const tx = p.x + nx * arm;
    const ty = p.y + ny * arm;
    g.moveTo(p.x, p.y).lineTo(tx, ty).stroke({ width: w, color: SECTION_COLOR });
    g.moveTo(tx, ty)
      .lineTo(tx - ux * head * 0.6 - nx * head, ty - uy * head * 0.6 - ny * head)
      .lineTo(tx + ux * head * 0.6 - nx * head, ty + uy * head * 0.6 - ny * head)
      .closePath()
      .fill({ color: SECTION_COLOR });
  }
}

/**
 * Kesit etiketlerini (A ve A') iki BitmapText olarak kurar (ROOM_FONT atlası — Türkçe + Latin).
 * Konum/ölçek `layoutSectionLabels` ile uygulanır → **ekran-sabit** (çizgi/oklarla tutarlı, zoom'da
 * şişmez). Container'ın ilk çocuğu A (start ucu), ikincisi A' (end ucu).
 */
export function buildSectionLabels(s: SectionLine): Container {
  const c = new Container();
  const base = s.label || 'A';
  for (const text of [base, `${base}'`]) {
    const t = new BitmapText({
      text,
      style: { fontFamily: ROOM_FONT, fontSize: LABEL_SIZE, align: 'center' },
    });
    t.anchor.set(0.5);
    c.addChild(t);
  }
  return c;
}

/**
 * Etiketleri ekran-sabit boyutla (scale = pixelSize) uçlara yerleştirir; offset de ekran-px'tir.
 * Zoom değişince çağrılır (redrawable) → çizgi/ok bayraklarıyla aynı görsel ölçekte kalır.
 */
export function layoutSectionLabels(c: Container, s: SectionLine, pixelSize: number): void {
  const { a, b } = s;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / len; // çizgiye dik (görüş yönü tarafı)
  const ny = (b.x - a.x) / len;
  const off = LABEL_OFFSET * pixelSize;
  const ends = [a, b];
  c.children.forEach((child, i) => {
    const p = ends[i] ?? a;
    child.scale.set(pixelSize);
    child.position.set(p.x + nx * off, p.y + ny * off);
  });
}
