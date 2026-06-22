# TESTING — Test Stratejisi

> Kaynak tohum: `docs/DOCS-BACKLOG.md §3`. "Yeşil test = bitti" kuralının (CLAUDE.md §0.5) somut hali.

---

## 1. Katman katman strateji

| Paket | Tür | Hedef | Araç |
|-------|-----|-------|------|
| `packages/geometry` | Birim test | **%90+ kapsam**, TDD | Vitest |
| `packages/document` | Birim test | **%90+ kapsam** (store, Command, undo/redo) | Vitest |
| `packages/engine` | Saf util birim + görsel/etkileşim | transform/charset birim; kritik akış e2e | Vitest + Playwright |
| `packages/tools` | FSM birim (durum geçişleri) + e2e | araç durum makineleri | Vitest + Playwright |
| `packages/io` | Birim + **altın dosya** | DXF parse doğruluğu | Vitest |
| `apps/web` | e2e (kullanıcı akışı) | çiz→seç→taşı→undo | Playwright |

## 2. Altın kurallar
- **Bug → önce onu yakalayan test, sonra düzeltme.** (Regression kalıcı.)
- **`geometry`/`document` için TDD tercih:** saf ve deterministik oldukları için test-önce kolay.
- **Saf mantığı saf tut:** DOM/canvas gerektirmeyen her şey (transform matematiği, alan hesabı, FSM geçişleri) birim testle; e2e'yi yalnızca gerçek etkileşim için sakla (yavaş + kırılgan).

## 3. Altın test setleri (regression çıpa)
- **DXF import çıpası:** gerçek bir `.dxf` dosyası → beklenen entity sayısı, katmanlar, ölçek; sonra mahal sayısı + her mahalin m²'si (±tolerans). Faz 1D/1E'de eklenir.
- **Türkçe glyph çıpası:** `TR_CHARSET` (bkz. `docs/I18N-TEXT.md`) atlasta tam üretiliyor mu; tüm Türkçe karakterli mahal adı bozulmadan render ediliyor mu.
- **Undo/redo çıpası:** N işlem → N undo → boş duruma dönüş; redo → tam geri geliş (1A'da).

## 4. CI kapısı (zorunlu)
Her push/PR'da `.github/workflows/ci.yml`: **`lint + typecheck + test + build` yeşil olmadan birleştirme yok.**
Faz 1'de Playwright e2e job'u eklenecek (ayrı, headless).

## 5. Performans testi (ileri faz)
- Sentetik **50k / 500k entity** sahneleri → FPS / frame-time ölçümü. Bütçe: `docs/PERFORMANCE.md`.
- CI'da performans regresyon eşiği (bütçeyi geçince kır).

## 6. Şimdiki durum (Faz 1 + 2A/2B, 2026-06-22 — gerçek sayılar)
Toplam **~214 birim test**, tümü yeşil (`pnpm test`):
- `geometry`: 33 ✅ (vec/segment/polygon/hull/hatch/planar-faces + segmentIntersection)
- `document`: 80 ✅ (store/command/history/rooms/metrics/takeoff/clone/serialize/entity geometrileri)
- `engine`: 31 ✅ (transform/charset/spatial-index/hit-test/entity-bounds/layer-state/linetypes)
- `io`: 24 ✅ (dxf import/export + svg export + kalibrasyon)
- `tools`: 15 ✅ (wall/select FSM + snapper)
- `copilot`: 31 ✅ (yönetmelik kuralları + atıf biçimi)

> Sayılar değişince burayı güncelle. **e2e (Playwright) henüz yok** — tarayıcı doğrulaması şu an
> headless Chrome/CDP ekran görüntüsüyle (CLAUDE.md §3); Playwright ileri faz.
