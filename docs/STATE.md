# STATE — Nerede kaldık?

> **Claude:** Her oturuma bunu okuyarak başla, oturum sonunda güncelle. Bu dosya "tek doğru" ilerleme kaydıdır.
> Format: en üstte güncel durum, altta kısa günlük (en yeni üstte).

---

## ŞU AN

**Faz:** 0 — İskelet → **TAMAMLANDI** ✅
**Branch:** `feat/phase-0-scaffold`
**Durum:** Monorepo iskeleti + pan/zoom yapan boş canvas + yeşil doğrulama zinciri kuruldu.

**Faz 0 kabul kriteri karşılandı:**
- `pnpm dev` → tarayıcıda pan (sürükle) + zoom (tekerlek, imleç-merkezli) + grid. Dev sunucusu HTTP 200, sayfa içeriği doğrulandı.
- `pnpm typecheck` (3/3) · `pnpm test` (geometry 3 + engine 4) · `pnpm lint` (3/3) · `pnpm build` → **hepsi yeşil**.
- GitHub Actions CI workflow eklendi (`.github/workflows/ci.yml`).

**Kurulan yapı:**
- `apps/web` — Next.js 15 + React 19 + Tailwind v4; `CanvasStage` client component engine'i mount eder.
- `packages/engine` — PixiJS v8 `createCanvasApp` (pan/zoom/grid) + saf `Camera` transform util'leri (test'li).
- `packages/geometry` — saf TS `Vec2` + `polygonArea` (Shoelace, test'li).
- Tooling: TS strict base, ESLint flat config, Prettier, Turborepo, pnpm workspaces.

**Sıradaki adım (Faz 1 — Çizim + Import + Mahal):**
1. `packages/document` — entity store + Command + undo/redo (CLAUDE.md §6.3).
2. `packages/tools` — XState ile çizim araçları (duvar/seç/taşı), snapping.
3. `packages/io` — DXF import (sonra libredwg-web), 2-nokta ölçekleme.
4. Mahal otomatik bulma + isim + canlı m².
> Faz 1'e geçmeden Moses onayı beklenir.

**Notlar / kararlar:**
- AI çağrıları için sağlayıcı-bağımsız adapter kararı eklendi (ADR-0006); Faz 0'da kurulmadı, Faz 2'de.
- pnpm 11 build-script bloklaması: `esbuild` + `sharp` `pnpm-workspace.yaml`'de izinli.

**Açık sorular / Moses'a sorulacak:** (yok)

---

## GÜNLÜK

### 2026-06-19
- **Faz 0 tamamlandı:** monorepo (pnpm+turbo), Next.js+PixiJS pan/zoom canvas, geometry/engine testleri, CI. Branch `feat/phase-0-scaffold`. Doğrulama zinciri yeşil; dev HTTP 200.
- AI adapter tasarımı ADR-0006 olarak `docs/DECISIONS.md`'ye not düşüldü (provider-agnostic: Anthropic+OpenAI, statik + router/fallback).
- Proje başlatıldı. Rayon.design + AI render + tarayıcıda DWG/DXF + CRDT işbirliği araştırıldı (`docs/LANDSCAPE.md`).
- `CLAUDE.md` (anayasa) ve `docs/` iskeleti yazıldı.
- Kararlar: TypeScript-first stack, PixiJS render, Yjs-first collab, aşamalı AI render (görsel → 3D). Detay `docs/DECISIONS.md`.
