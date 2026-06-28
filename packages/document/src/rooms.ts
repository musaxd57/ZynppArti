import { findFaces, polygonCentroid, type Segment, type Vec2 } from '@zynpparti/geometry';
import type { EntityStore, StoreChange } from './store';
import type { EntityId, Space } from './entities';
import { AddEntity, RemoveEntity } from './command';
import { createEntityId } from './id';

const CENTROID_MATCH_TOL = 50; // cm — eski mahalin adını yeni yüze taşımak için
/**
 * Mahal bulma (findFaces) segment-çiftleri üzerinde O(n²) çalışır → çok büyük modelde (ör. 500k duvar)
 * UI'yi dakikalarca dondurur. Bu eşiğin üstünde otomatik mahal türetmeyi ATLA (mahaller türetilmez ama
 * çizim/pan/zoom akıcı kalır). Gerçek planlar bunun çok altında; perf/stres testini de mümkün kılar.
 * (İleride planar-faces spatial-hash ile hızlanınca yükseltilir — PERFORMANCE.md.)
 */
const MAX_FACE_WALLS = 8000;

/**
 * Duvarlardan mahalleri otomatik bulur ve store'u günceller (ENGINEERING-NOTES §1).
 * Duvarlar değişince yeniden hesaplar (canlı m²).
 *
 * Mahaller TÜRETİLMİŞ veridir → undo geçmişini kirletmemek için doğrudan store'a (Command.apply)
 * uygulanır, History'ye girmez. Yeniden-giriş, `recomputing` bayrağıyla engellenir (ADR-0012).
 */
export class RoomManager {
  private knownWalls = new Set<EntityId>();
  private recomputing = false;
  private readonly unsubscribe: () => void;
  /**
   * Yüklenen (kaydedilmiş) mahaller — SONRAKİ recompute'un eşleşme kaynağına eklenir, bir kez tüketilir.
   * Sebep (denetim H0): kaydet→aç turunda mahaller store'a girmeden çıkarılır; eşleşecek "eski" mahal
   * olmadığından ad/tip/malzeme 'Mahal'a düşerdi. Bunları tohum verince centroid eşleşmesi adı geri taşır.
   */
  private seededSpaces: Space[] = [];

  constructor(private readonly store: EntityStore, initialSpaces?: readonly Space[]) {
    this.unsubscribe = store.subscribe((c) => this.onChange(c));
    if (initialSpaces?.length) this.seedSpaces(initialSpaces);
    this.recompute();
  }

  /**
   * Yüklenen mahalleri sonraki recompute'un ad/tip/malzeme eşleşme kaynağına ekler (store'a YAZMAZ —
   * türetilmiş mahallerle çakışmasın). Çağıran hemen ardından duvarları dispatch eder → recompute tetiklenir.
   */
  seedSpaces(spaces: readonly Space[]): void {
    for (const s of spaces) {
      if (s.type === 'space' && s.boundary.length >= 3) this.seededSpaces.push(s);
    }
  }

  private onChange(change: StoreChange): void {
    if (this.recomputing) return;
    const wallsTouched =
      change.removed.some((id) => this.knownWalls.has(id)) ||
      [...change.added, ...change.updated].some((id) => this.store.get(id)?.type === 'wall');
    if (wallsTouched) this.recompute();
  }

  /** Mahalleri yeniden hesapla ve store'a yansıt. */
  recompute(): void {
    // Tohum (yüklenen mahaller) BU çağrıda tüketilir → EN BAŞTA al + alanı temizle. Aksi halde erken-return
    // yollarında (büyük model / findFaces throw, aşağıda) tohum sızıp SONRAKİ model açılışında ilgisiz bir
    // odaya ad/tip/malzeme bulaştırırdı (RoomManager mount başına bir kez, açılışlar arası paylaşılır). (Self-review.)
    const seeded = this.seededSpaces;
    this.seededSpaces = [];

    const walls = this.store.byType('wall');
    this.knownWalls = new Set(walls.map((w) => w.id));

    // Çok büyük modelde findFaces (O(n²)) UI'yi dondurur → mahal türetmeyi atla (çizim akıcı kalır).
    // Nadir (gerçek planlar çok altında) → tek uyarı yeterli, spam değil.
    if (walls.length > MAX_FACE_WALLS) {
      console.warn(`RoomManager: ${walls.length} duvar > ${MAX_FACE_WALLS} → mahal türetme atlandı (perf).`);
      return;
    }

    const segments: Segment[] = walls.map((w) => ({ a: w.start, b: w.end }));
    let faces: Vec2[][];
    try {
      faces = findFaces(segments);
    } catch (err) {
      // Dejenere/bozuk geometri yüz-bulmayı patlatırsa: eski mahalleri KORU, app'i kilitleme.
      console.error('RoomManager: mahal yeniden-hesabı başarısız, eski mahaller korunuyor.', err);
      return;
    }

    // Store'daki mahaller silinip yeniden türetilir; eşleşme kaynağı = store + tohum (yüklenen mahaller).
    const storeSpaces = this.store.byType('space');
    const matchSources: Space[] = [...storeSpaces, ...seeded];

    // BİRE-BİR eşleştirme: her eski mahal en fazla BİR yeni yüze ad/tip/malzeme verir. Aksi halde bir oda
    // ikiye bölününce ve iki çocuk centroid'i de eski centroid'in toleransındaysa, aynı eski mahal iki
    // çocuğa birden kopyalanır (Y1). Açgözlü en-yakın-önce: tüm (yüz, eskiMahal) çiftlerini mesafeye göre
    // sırala; ikisi de boştaysa eşle, ikisini de tüketilmiş işaretle.
    // Alan-ağırlıklı centroid (M0): bir kenara ara nokta eklenince poligon ŞEKLİ değişmez → centroid sabit
    // kalır; köşe-ortalaması ise kayar ve ad eşleşmesi kopardı.
    const faceCentroids = faces.map((b) => polygonCentroid(b));
    const oldValid = matchSources
      .map((s, i) => ({ i, c: polygonCentroid(s.boundary), ok: s.boundary.length >= 3 }))
      .filter((o) => o.ok);
    const pairs: Array<{ fi: number; oi: number; d: number }> = [];
    for (let fi = 0; fi < faces.length; fi++) {
      if (faces[fi]!.length < 3) continue;
      for (const o of oldValid) {
        const d = dist(o.c, faceCentroids[fi]!);
        if (d < CENTROID_MATCH_TOL) pairs.push({ fi, oi: o.i, d });
      }
    }
    pairs.sort((a, b) => a.d - b.d);
    const matchOf = new Map<number, Space>(); // faceIdx → eski mahal
    const usedFace = new Set<number>();
    const usedOld = new Set<number>();
    for (const p of pairs) {
      if (usedFace.has(p.fi) || usedOld.has(p.oi)) continue;
      usedFace.add(p.fi);
      usedOld.add(p.oi);
      matchOf.set(p.fi, matchSources[p.oi]!);
    }

    const newSpaces: Space[] = faces.map((boundary, fi) => {
      const match = matchOf.get(fi);
      return {
        id: createEntityId(),
        type: 'space',
        layerId: 'rooms',
        name: match?.name ?? 'Mahal',
        // Ad gibi tip + malzeme de eski yüzden yeni yüze taşınır (kullanıcı ataması kaybolmasın).
        roomType: match?.roomType,
        material: match?.material,
        boundary,
      };
    });

    // try/finally: store ops/emit patlasa bile `recomputing` sıfırlansın (yoksa manager zombi olur —
    // bir daha hiç mahal hesaplamaz). Denetim bulgusu.
    this.recomputing = true;
    try {
      // Yalnız STORE'daki mahaller silinir (tohum mahaller store'da değil — yalnız eşleşme kaynağıydı).
      for (const s of storeSpaces) new RemoveEntity(s.id).apply(this.store);
      for (const s of newSpaces) new AddEntity(s).apply(this.store);
      this.store.emit({
        added: newSpaces.map((s) => s.id),
        updated: [],
        removed: storeSpaces.map((s) => s.id),
      });
    } finally {
      this.recomputing = false; // (tohum zaten en başta tüketildi → burada tekrar temizlemeye gerek yok)
    }
  }

  destroy(): void {
    this.unsubscribe();
  }
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
