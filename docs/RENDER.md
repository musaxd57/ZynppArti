# RENDER — AI render hattı

> CLAUDE.md §8.7'nin uzun hali. Faz 2'de doldurulur.

## Kapsam (doldurulacak)
- Plan/kesit → kenar/segment koşulu → ControlNet → diffusion akışı
- Model seçimi: başlangıç Replicate/Fal API; sonra self-host (ComfyUI)
- Prompt şablonları (stil, malzeme, ışık, açı) ve negative prompt'lar
- Varyant üretimi, tutarlılık (seed/IP-adapter), upscale
- Kuyruk mimarisi (BullMQ), istemciye push, önbellek
- Maliyet modeli ve kullanıcı kotası (render başına ~düşük sentler)
