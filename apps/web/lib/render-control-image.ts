'use client';

import * as THREE from 'three';
import { exportSvg } from '@zynpparti/io';
import { wallBoxesWithOpenings, type Entity, type EntityStore } from '@zynpparti/document';

/**
 * "Geometriyi koru" render için TEMİZ kontrol görseli üretimi (istemci).
 *
 * İKİNCİL yol — "Üstten Plan (stilize)": yalnız DUVAR/KAPI/BLOK entity'lerini SVG'ye verir (ölçü, metin,
 * mahal etiketi, hatch HARİÇ) → canny/MLSD bu çizgilere kilitlenir; etiket/ölçü dahil edilseydi onları
 * "hayalet duvar" olarak yeniden üretirdi (denetim/araştırma bulgusu). Beyaz zemine 1024² letterbox.
 *
 * (BİRİNCİL yol 3B perspektif snapshot'tır — View3D toDataURL — bu util ona gerekmez; o doğası gereği
 * temizdir: ölçü/etiket içermez.)
 */
const CONTROL_TYPES = new Set(['wall', 'opening', 'block']);
const MAX = 1024;

export async function wallsOnlyControlPng(entities: readonly Entity[]): Promise<string | null> {
  const clean = entities.filter((e) => CONTROL_TYPES.has(e.type));
  if (clean.length === 0) return null; // çizilecek duvar yok
  const svg = exportSvg(clean);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('SVG → görsel yüklenemedi'));
      i.src = url;
    });
    const c = document.createElement('canvas');
    c.width = MAX;
    c.height = MAX;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, MAX, MAX);
    const scale = Math.min(1, MAX / Math.max(img.width || 1, img.height || 1));
    const w = (img.width || MAX) * scale;
    const h = (img.height || MAX) * scale;
    ctx.drawImage(img, (MAX - w) / 2, (MAX - h) / 2, w, h);
    return c.toDataURL('image/jpeg', 0.92);
  } catch (e) {
    console.error('Kontrol görseli üretilemedi:', e);
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** data-url boyut guard (sunucu ≤3.5MB ister; baz64 ~%33 şişer). */
export function controlImageTooLarge(dataUrl: string): boolean {
  return dataUrl.length > 3_500_000;
}

/**
 * BİRİNCİL yol — "3B Perspektif": duvarları yüksekliklerine göre ekstrüde edip OFFSCREEN three.js ile bir
 * perspektif kare üretir → ControlNet'e depth/structure koşulu olur. Difüzyon modelleri göz-hizası
 * fotoğrafla eğitilir → perspektif kare fotogerçekçi iç-mekan verir (üstten plan vermez). View3D modalına
 * GEREK YOK: sahne tamamen `store`'dan kurulur, render edilir, atılır (kaynaklar dispose edilir).
 */
export function perspectiveControlPng(store: EntityStore): string | null {
  const walls = store.byType('wall');
  if (walls.length === 0) return null;
  const openings = store.byType('opening');
  const boxes = wallBoxesWithOpenings(walls, openings);
  if (boxes.length === 0) return null;

  const SIZE = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  let renderer: THREE.WebGLRenderer | null = null;
  const disposables: { dispose(): void }[] = [];
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(SIZE, SIZE, false);
    renderer.setClearColor(0xeaeaea, 1);
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);

    // Model sınırlarını topla (kamera konumu için).
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (const w of walls) {
      for (const p of [w.start, w.end]) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minZ) minZ = p.y;
        if (p.y > maxZ) maxZ = p.y;
      }
    }
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ, 100);

    const floorGeo = new THREE.PlaneGeometry(span * 3, span * 3);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xcfcfcf });
    disposables.push(floorGeo, floorMat);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xdedede });
    disposables.push(wallMat);
    for (const b of boxes) {
      const g = new THREE.BoxGeometry(b.length, b.height, b.thickness);
      disposables.push(g);
      const mesh = new THREE.Mesh(g, wallMat);
      mesh.position.set(b.cx, (b.baseHeight ?? 0) + b.height / 2, b.cy);
      mesh.rotation.y = -b.angleRad;
      scene.add(mesh);
    }
    dir.position.set(cx + span, span * 1.5, cz + span * 0.6);
    scene.add(dir);

    // Köşeden bakan perspektif (iç-mekan hissi): yükseklikçe göz hizasının üstünde, modele bakar.
    const cam = new THREE.PerspectiveCamera(55, 1, 1, span * 20);
    cam.position.set(cx + span * 0.9, span * 0.85, cz + span * 0.9);
    cam.lookAt(cx, span * 0.18, cz);

    renderer.render(scene, cam);
    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (e) {
    console.error('3B kontrol görseli üretilemedi:', e);
    return null;
  } finally {
    for (const d of disposables) d.dispose();
    renderer?.dispose();
  }
}
