'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { wallBoxesWithOpenings, type EntityStore, type Opening, type Wall } from '@zynpparti/document';

/**
 * Şematik 3B önizleme (Faz 5 başlangıcı): duvarları yüksekliklerine göre ekstrüde edip three.js'te
 * gösterir. Tam 3B/BIM değil — duvar yüksekliği (Wall.height ?? 280) ile basit hacim. Elle orbit
 * (sürükle döndür, tekerlek yakınlaş). 2B tuvali etkilemez (ayrı overlay; açınca anlık görüntü alır).
 *
 * Hata olursa (WebGL yok/bellek) overlay'de mesaj gösterir, uygulamayı kilitlemez.
 */
export function View3D({ store }: { store: EntityStore }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;
    setError(null);

    const walls = store.all().filter((e): e is Wall => e.type === 'wall');
    const openings = store.all().filter((e): e is Opening => e.type === 'opening');
    const boxes = wallBoxesWithOpenings(walls, openings);
    if (boxes.length === 0) {
      setError('Önce 2B tuvalde duvar çiz, sonra 3B önizlemeyi aç.');
      return;
    }

    let cleanup = (): void => {};
    try {
      const W = container.clientWidth || 800;
      const H = container.clientHeight || 600;

      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (const b of boxes) {
        minX = Math.min(minX, b.cx);
        maxX = Math.max(maxX, b.cx);
        minZ = Math.min(minZ, b.cy);
        maxZ = Math.max(maxZ, b.cy);
      }
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      const span = Math.max(maxX - minX, maxZ - minZ, 300);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x141414);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(W, H);
      container.appendChild(renderer.domElement);

      const cam = new THREE.PerspectiveCamera(50, W / H, 1, span * 30);
      const target = new THREE.Vector3(cx, 0, cz);
      let theta = Math.PI / 4;
      let phi = Math.PI / 3.2;
      let radius = span * 1.9;
      const updateCam = (): void => {
        cam.position.set(
          target.x + radius * Math.sin(phi) * Math.cos(theta),
          target.y + radius * Math.cos(phi),
          target.z + radius * Math.sin(phi) * Math.sin(theta),
        );
        cam.lookAt(target);
      };
      updateCam();

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x202225, 0.55)); // gökyüzü/zemin yumuşak dolgu
      const dir = new THREE.DirectionalLight(0xffffff, 0.85);
      dir.position.set(span, span * 2, span * 0.5);
      scene.add(dir);

      const floorGeo = new THREE.PlaneGeometry(span * 2.5, span * 2.5);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(cx, 0, cz);
      scene.add(floor);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0xd2d2d8 });
      const geos: THREE.BoxGeometry[] = [];
      for (const b of boxes) {
        const g = new THREE.BoxGeometry(b.length, b.height, b.thickness);
        geos.push(g);
        const mesh = new THREE.Mesh(g, wallMat);
        mesh.position.set(b.cx, (b.baseHeight ?? 0) + b.height / 2, b.cy);
        mesh.rotation.y = -b.angleRad;
        scene.add(mesh);
      }

      // Elle orbit (OrbitControls bağımlılığı yok).
      let dragging = false;
      let lx = 0;
      let ly = 0;
      const onDown = (e: PointerEvent): void => {
        dragging = true;
        lx = e.clientX;
        ly = e.clientY;
      };
      const onMove = (e: PointerEvent): void => {
        if (!dragging) return;
        theta -= (e.clientX - lx) * 0.01;
        phi = Math.min(Math.PI / 2 - 0.05, Math.max(0.12, phi - (e.clientY - ly) * 0.01));
        lx = e.clientX;
        ly = e.clientY;
        updateCam();
      };
      const onUp = (): void => {
        dragging = false;
      };
      const onWheel = (e: WheelEvent): void => {
        e.preventDefault();
        radius = Math.min(span * 9, Math.max(span * 0.3, radius * (1 + Math.sign(e.deltaY) * 0.12)));
        updateCam();
      };
      renderer.domElement.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

      const onResize = (): void => {
        const w2 = container.clientWidth || W;
        const h2 = container.clientHeight || H;
        renderer.setSize(w2, h2);
        cam.aspect = w2 / h2;
        cam.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      let raf = 0;
      const loop = (): void => {
        raf = requestAnimationFrame(loop);
        renderer.render(scene, cam);
      };
      loop();

      cleanup = (): void => {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('pointerdown', onDown);
        renderer.domElement.removeEventListener('wheel', onWheel);
        geos.forEach((g) => g.dispose());
        floorGeo.dispose();
        floorMat.dispose();
        wallMat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      };
    } catch (e) {
      console.error('3B önizleme başlatılamadı:', e);
      setError('3B önizleme açılamadı (WebGL desteklenmiyor olabilir).');
    }
    return () => cleanup();
  }, [open, store]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-[var(--surface-2)] px-3.5 py-1.5 text-sm text-[var(--text-1)] shadow-sm ring-1 ring-[var(--border-soft)] transition-colors hover:bg-[var(--surface-3)]"
          title="Duvarları 3B önizle (şematik)"
        >
          🧊 3B
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-white">
            <span className="text-sm font-semibold">3B Önizleme (şematik)</span>
            <span className="text-[11px] text-white/50">sürükle: döndür · tekerlek: yakınlaş</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded px-3 py-1 text-sm hover:bg-white/10"
            >
              ✕ Kapat
            </button>
          </div>
          <div ref={containerRef} className="relative min-h-0 flex-1">
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
