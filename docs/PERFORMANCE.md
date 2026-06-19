# PERFORMANCE — Bütçeler ve ölçüm

> CLAUDE.md §9'un uzun hali.

## Hedef bütçeler
- **Render:** 50k entity akıcı; 500k entity'de **60 FPS** (16.6 ms/kare).
- **İlk açılış (model yükleme):** hedef TBD.
- **Bellek:** doküman verisi tek yerde; gereksiz kopya yok.

## Yöntemler (uygulanacak/ölçülecek)
- Viewport culling, draw-call batching, dirty-entity/dirty-rect yeniden çizim, LOD
- GPU shader (dash/hatch/kalınlık) — CPU'da milyon çizgi yok
- Ağ: commit/diff bazlı senkron (tüm model değil)
- Storage: model=dosya (ilişkisel DB'yi entity ile şişirme)

## Ölçüm (kurulacak)
- FPS/frame-time profili (sentetik 50k & 500k entity sahneleri)
- Bellek profili; regresyon için CI'da performans bütçesi kontrolü
