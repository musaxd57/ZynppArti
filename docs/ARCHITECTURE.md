# ARCHITECTURE — Detaylı mimari

> CLAUDE.md §6'nın uzun, diyagramlı hali. Faz ilerledikçe doldurulur.

## Kapsam (doldurulacak)
- Tam veri akışı diyagramı (UI → Command → Document → Engine → Collab → Sync/Storage)
- Command sistemi detayı: apply/invert sözleşmesi, batch/transaction, undo/redo yığını
- Multiplayer undo/redo köşe durumları (tek tek tanımlanacak — uydurma yok)
- Commit-log + invariant doğrulama modeli (north star); katman döngüsü invariant'ı
- Persistence: model=dosya formatı, lazy migration, snapshot/commit
- Sürüm kontrolü: Git-benzeri geçmiş, branch/merge
- Metin render: MSDF → vektör metin geçişi

Şimdilik taşıyıcı ilkeler CLAUDE.md §6'da.
