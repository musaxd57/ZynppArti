# STATE — Nerede kaldık?

> **Claude:** Her oturuma bunu okuyarak başla, oturum sonunda güncelle. Bu dosya "tek doğru" ilerleme kaydıdır.
> Format: en üstte güncel durum, altta kısa günlük (en yeni üstte).

---

## ŞU AN

**Faz:** 0 — İskelet
**Durum:** Planlama tamamlandı. Repo henüz boş (sadece `.git` + `CLAUDE.md` + `docs/`).

**Tamamlanan:**
- Proje vizyonu, mimari ve teknoloji yığını kararlaştırıldı (bkz. `CLAUDE.md`, `docs/DECISIONS.md`).
- Yol haritası 6 faza bölündü (bkz. `docs/ROADMAP.md`).

**Sıradaki adım (Faz 0 ilk iş):**
1. Monorepo iskeleti: pnpm workspaces + Turborepo, root `package.json`, `tsconfig` base, ESLint+Prettier.
2. `apps/web` — Next.js + React + Tailwind iskeleti.
3. `packages/engine` — PixiJS canvas, pan/zoom çalışan boş tuval.
4. `packages/geometry` — ilk saf fonksiyon + Vitest kurulumu.
5. GitHub Actions CI (lint + typecheck + test).
6. `CLAUDE.md §3`'teki komutları gerçek hale getir.

**Açık sorular / Moses'a sorulacak:** (yok)

---

## GÜNLÜK

### 2026-06-19
- Proje başlatıldı. Rayon.design + AI render + tarayıcıda DWG/DXF + CRDT işbirliği araştırıldı.
- `CLAUDE.md` (anayasa) ve `docs/` iskeleti yazıldı.
- Kararlar: TypeScript-first stack, PixiJS render, Yjs-first collab, aşamalı AI render (görsel → 3D). Detay `docs/DECISIONS.md`.
