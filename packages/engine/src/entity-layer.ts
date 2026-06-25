import { Container, Graphics } from 'pixi.js';
import { materialById, type Entity, type EntityId, type EntityStore, type StoreChange } from '@zynpparti/document';
import { SpatialIndex, type AABB } from './spatial-index';
import { entityBounds, openingBounds } from './entity-bounds';
import { buildWall, strokeWall } from './render-wall';
import { buildSpaceFill, buildSpaceLabel, drawSpaceMaterial, drawSpacePerimeter } from './render-space';
import { drawOpening } from './render-opening';
import { drawDimension, buildDimensionLabel } from './render-dimension';
import { drawParcel } from './render-parcel';
import { drawBlock } from './render-block';
import { buildAnnotation } from './render-annotation';
import { buildComment } from './render-comment';
import { buildSheet } from './render-sheet';
import { drawSection, buildSectionLabels, layoutSectionLabels } from './render-section';
import { LayerState } from './layer-state';

/**
 * Store'a abone olup entity'leri PixiJS'te çizen katman + mekânsal indeks (rbush).
 * Z-sırası: mahal dolguları (altta) → duvarlar (ortada) → etiketler (üstte).
 *
 * - **Dirty-render:** yalnız değişen entity'nin görsellerini yeniden kurar.
 * - **Viewport culling:** yalnız görünür kutuyla kesişenleri `visible` yapar.
 */
export class EntityLayer {
  readonly container = new Container();
  readonly index = new SpatialIndex();
  // Hibrit z (ADR-0040): 3 bant. ALT (sabit): pafta çerçeveleri + oda dolguları. ORTA
  // (katman-sıralı): duvar/boşluk/blok/parsel/ölçü/kesit çizgileri — her layerId kendi
  // alt-container'ında, LayerState sırasına göre dizilir. ÜST (sabit): tüm metin/etiketler.
  private readonly sheetLayer = new Container();
  private readonly spaceFill = new Container();
  private readonly middleBand = new Container();
  private readonly labelLayer = new Container();
  /** Orta banttaki katman-başına container (layerId → Container); LayerState sırasına göre dizilir. */
  private readonly layerContainers = new Map<string, Container>();
  private readonly objects = new Map<EntityId, Container[]>();
  /** Ekran-sabit konturları zoom değişince yeniden çizen kapamalar (lineweight hiyerarşisi). */
  private readonly redrawables = new Map<EntityId, (pixelSize: number) => void>();
  /**
   * Boşluk binding TERS indeksi: duvar id → o duvara bağlı boşluk id'leri (+ her boşluğun mevcut
   * duvarı). Duvar değişince (her sürükle-kare'sinde) bağlı boşlukları O(boşluk) ile yeniden çizmek
   * için — eskiden `store.all()` ile O(n) tüm modeli tarıyordu (500k entity'de drag jank). (Denetim/perf.)
   */
  private readonly openingsByWall = new Map<EntityId, Set<EntityId>>();
  private readonly openingWall = new Map<EntityId, EntityId>();
  /** Son uygulanan pixelSize (= 1/zoom); yalnız değişince konturlar yenilenir. */
  private lineweightPx = 1;
  /** Son uygulanan viewport — katman görünürlüğü değişince yeniden uygulamak için saklanır. */
  private lastViewport: AABB | null = null;
  /** Şu an görünür entity'ler — artımlı cull için (yalnız değişen görünürlükleri dokun). */
  private prevVisible = new Set<EntityId>();
  /** cull için yeniden kullanılan tampon — her karede yeni Set ayırmamak için prevVisible ile takas edilir. */
  private cullBuffer = new Set<EntityId>();
  private readonly unsubscribe: () => void;
  private readonly unsubscribeLayers: () => void;

  constructor(
    private readonly store: EntityStore,
    private readonly layers: LayerState = new LayerState(),
  ) {
    this.container.addChild(
      this.sheetLayer, // en altta: pafta çerçevesi (kağıt) → çizimi kapatmaz
      this.spaceFill, // oda dolguları + malzeme + çevre (hep altta — hibrit z)
      this.middleBand, // katman-sıralı orta bant (çizgisel entity'ler)
      this.labelLayer, // en üstte: tüm metin/etiketler (hep üstte — hibrit z)
    );

    const entries: { id: EntityId; box: AABB }[] = [];
    for (const e of store.all()) {
      this.render(e);
      entries.push({ id: e.id, box: this.boundsOf(e) });
    }
    this.index.bulkLoad(entries);

    this.reorderMiddle(); // bulkLoad sonrası orta-bant katmanlarını sıraya diz
    this.unsubscribe = store.subscribe((change) => this.onChange(change));
    // Katman görünürlüğü VEYA z-sırası değişince: orta bandı yeniden sırala + görünürlüğü yeniden uygula.
    this.unsubscribeLayers = this.layers.subscribe(() => {
      this.reorderMiddle();
      if (this.lastViewport) this.cull(this.lastViewport);
    });
  }

  /**
   * Orta bantta bir layerId'nin container'ını döndürür (yoksa oluşturur + sıraya sokar). Çizgisel
   * entity'ler (duvar/boşluk/blok/parsel/ölçü/kesit) buraya konur → katman z-sırası geçerli olur.
   */
  private layerContainer(layerId: string): Container {
    let c = this.layerContainers.get(layerId);
    if (!c) {
      c = new Container();
      this.layerContainers.set(layerId, c);
      this.middleBand.addChild(c);
      this.reorderMiddle();
    }
    return c;
  }

  /** Orta-bant katman container'larını LayerState sırasına göre dizer (ön→arka; ön = en üstte çizilir). */
  private reorderMiddle(): void {
    const ids = [...this.layerContainers.keys()];
    // sortLayers ön→arka verir; Pixi'de sonra eklenen üstte → arka önce gelmeli (child index 0 = arka).
    const backToFront = this.layers.sortLayers(ids).reverse();
    backToFront.forEach((id, i) => {
      const c = this.layerContainers.get(id);
      if (c) this.middleBand.setChildIndex(c, i);
    });
  }

  /** Entity'nin AABB'si. Boşluk (opening) duvara bağlı → duvar çözülerek hesaplanır. */
  private boundsOf(e: Entity): AABB {
    if (e.type === 'opening') {
      const wall = this.store.get(e.wallId);
      if (wall?.type === 'wall') return openingBounds(e, wall);
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    return entityBounds(e);
  }

  private onChange(change: StoreChange): void {
    for (const id of change.removed) this.removeEntity(id);
    for (const id of change.added) this.upsert(id, true);
    for (const id of change.updated) this.upsert(id, false);

    // Binding: duvar eklendi/değişti → SADECE o duvarlara bağlı boşlukları yeniden çiz (ters indeks).
    // (Eskiden store.all() ile tüm model taranıyordu → 500k entity'de her drag-kare O(n); şimdi O(boşluk).)
    for (const id of change.added) this.reupsertOpeningsOf(id);
    for (const id of change.updated) this.reupsertOpeningsOf(id);

    // (helper aşağıda)

    // Yeni/değişen objeler gizli oluşturulur (artımlı cull şartı); kamera oynamasa da görünür alandakiler
    // hemen açılsın diye değişiklik sonrası cull'u yeniden uygula (artımlı → ucuz, ekran içeriğiyle sınırlı).
    if (this.lastViewport) this.cull(this.lastViewport);
  }

  private upsert(id: EntityId, isNew: boolean): void {
    const entity = this.store.get(id);
    if (!entity) return;
    this.render(entity);
    const box = this.boundsOf(entity);
    if (isNew) this.index.insert(id, box);
    else this.index.update(id, box);
  }

  /** id bir DUVARSA ona bağlı boşlukları yeniden çiz/indeksle (konum duvardan türer). Ters indeks → O(boşluk). */
  private reupsertOpeningsOf(wallId: EntityId): void {
    const ops = this.openingsByWall.get(wallId);
    if (!ops || ops.size === 0) return;
    for (const oid of [...ops]) this.upsert(oid, false);
  }

  /** Boşluğu ters indekse işle (duvarı değiştiyse eski duvardan çıkar). */
  private trackOpening(id: EntityId, wallId: EntityId): void {
    const prev = this.openingWall.get(id);
    if (prev !== undefined && prev !== wallId) this.openingsByWall.get(prev)?.delete(id);
    this.openingWall.set(id, wallId);
    let set = this.openingsByWall.get(wallId);
    if (!set) this.openingsByWall.set(wallId, (set = new Set()));
    set.add(id);
  }

  /** Entity'nin görsellerini (sil-yeniden kur) ilgili z-katmanlarına yerleştirir. */
  private render(entity: Entity): void {
    this.destroyObjects(entity.id);
    if (entity.type === 'opening') this.trackOpening(entity.id, entity.wallId); // ters indeks (init + upsert)
    const objs: Container[] = [];
    const px = this.lineweightPx;
    if (entity.type === 'wall') {
      const g = new Graphics();
      const geom = buildWall(entity); // dünya-uzaylı geometri bir kez; zoom'da yeniden hesaplanmaz
      strokeWall(g, geom, px);
      this.layerContainer(entity.layerId).addChild(g);
      objs.push(g);
      this.redrawables.set(entity.id, (p) => strokeWall(g, geom, p));
    } else if (entity.type === 'opening') {
      const g = new Graphics();
      const wall = this.store.get(entity.wallId);
      if (wall?.type === 'wall') drawOpening(g, entity, wall, px);
      this.layerContainer(entity.layerId).addChild(g);
      objs.push(g);
      this.redrawables.set(entity.id, (p) => {
        const w = this.store.get(entity.wallId);
        if (w?.type === 'wall') drawOpening(g, entity, w, p);
      });
    } else if (entity.type === 'dimension') {
      const g = new Graphics();
      drawDimension(g, entity, px);
      this.layerContainer(entity.layerId).addChild(g);
      objs.push(g);
      this.redrawables.set(entity.id, (p) => drawDimension(g, entity, p));
      const label = buildDimensionLabel(entity);
      this.labelLayer.addChild(label);
      objs.push(label);
    } else if (entity.type === 'parcel') {
      const g = new Graphics();
      drawParcel(g, entity, px);
      this.layerContainer(entity.layerId).addChild(g);
      objs.push(g);
      this.redrawables.set(entity.id, (p) => drawParcel(g, entity, p));
    } else if (entity.type === 'block') {
      const g = new Graphics();
      drawBlock(g, entity, px);
      this.layerContainer(entity.layerId).addChild(g);
      objs.push(g);
      this.redrawables.set(entity.id, (p) => drawBlock(g, entity, p));
    } else if (entity.type === 'section') {
      const g = new Graphics();
      drawSection(g, entity, px);
      this.layerContainer(entity.layerId).addChild(g);
      objs.push(g);
      const labels = buildSectionLabels(entity);
      layoutSectionLabels(labels, entity, px);
      this.labelLayer.addChild(labels);
      objs.push(labels);
      // Tek redrawable: zoom'da çizgi/oklar + etiketler birlikte ekran-sabit yenilenir.
      this.redrawables.set(entity.id, (p) => {
        drawSection(g, entity, p);
        layoutSectionLabels(labels, entity, p);
      });
    } else if (entity.type === 'annotation') {
      const label = buildAnnotation(entity);
      this.labelLayer.addChild(label);
      objs.push(label);
    } else if (entity.type === 'comment') {
      const cm = buildComment(entity);
      this.labelLayer.addChild(cm);
      objs.push(cm);
    } else if (entity.type === 'sheet') {
      const sheet = buildSheet(entity, px);
      this.sheetLayer.addChild(sheet);
      objs.push(sheet);
      this.redrawables.set(entity.id, (p) => {
        const rebuilt = buildSheet(entity, p);
        sheet.removeChildren().forEach((ch) => ch.destroy());
        sheet.addChild(...rebuilt.removeChildren());
        rebuilt.destroy();
      });
    } else {
      const fill = buildSpaceFill(entity);
      this.spaceFill.addChild(fill);
      objs.push(fill);
      // Zemin malzemesi tarama deseni (varsa) — dolgunun üstünde, çevre/duvarın altında.
      const material = materialById(entity.material);
      const hatch = material ? new Graphics() : null;
      if (hatch && material) {
        drawSpaceMaterial(hatch, entity, material, px);
        this.spaceFill.addChild(hatch);
        objs.push(hatch);
      }
      const perimeter = new Graphics();
      drawSpacePerimeter(perimeter, entity, px);
      this.spaceFill.addChild(perimeter); // dolgunun üstünde, duvarların altında
      objs.push(perimeter);
      // Tek redrawable: zoom'da çevre + (varsa) malzeme hatch birlikte yenilenir.
      this.redrawables.set(entity.id, (p) => {
        drawSpacePerimeter(perimeter, entity, p);
        if (hatch && material) drawSpaceMaterial(hatch, entity, material, p);
      });
      const label = buildSpaceLabel(entity);
      this.labelLayer.addChild(label);
      objs.push(label);
    }
    // Görünürlük TEK kaynaktan (cull) yönetilir → yeni obje viewport dışındaysa yanlışlıkla çizilmesin
    // diye gizli başlar; değişiklik sonrası cull (satır ~71) görünür alandakileri açar. (Artımlı cull şartı.)
    for (const o of objs) o.visible = false;
    this.objects.set(entity.id, objs);
  }

  /**
   * Zoom değişince ekran-sabit konturları yeniden çizer (lineweight hiyerarşisi).
   * pixelSize aynıysa (yalnız pan) hiçbir şey yapmaz → ucuz.
   */
  updateLineweights(pixelSize: number): void {
    if (Math.abs(pixelSize - this.lineweightPx) < 1e-9) return;
    this.lineweightPx = pixelSize;
    for (const redraw of this.redrawables.values()) redraw(pixelSize);
  }

  private removeEntity(id: EntityId): void {
    // Boşluksa ters indeksten çıkar (set sınırsız büyümesin / sarkık binding kalmasın).
    const boundWall = this.openingWall.get(id);
    if (boundWall !== undefined) {
      this.openingsByWall.get(boundWall)?.delete(id);
      this.openingWall.delete(id);
    }
    this.destroyObjects(id);
    this.index.remove(id);
    this.prevVisible.delete(id); // silinen ID prevVisible'da kalmasın (set sınırsız büyümesin)
    this.pruneEmptyLayers();
  }

  /**
   * Boş kalan orta-bant katman container'larını yok eder (örn. bir katmanın tüm entity'leri silinince).
   * Aksi halde Map sınırsız büyür (DXF importu çok katman üretebilir) ve her reorder döngüsünde gezilir.
   */
  private pruneEmptyLayers(): void {
    for (const [layerId, c] of this.layerContainers) {
      if (c.children.length === 0) {
        c.destroy();
        this.layerContainers.delete(layerId);
      }
    }
  }

  private destroyObjects(id: EntityId): void {
    const objs = this.objects.get(id);
    if (objs) {
      for (const o of objs) o.destroy({ children: true }); // Container'lar (yorum/pafta) çocuklarıyla yok edilsin (sızıntı önle)
      this.objects.delete(id);
    }
    this.redrawables.delete(id);
  }

  /**
   * Görünürlüğü uygular: viewport içinde VE katmanı gizli değilse görünür. ARTIMLI — yalnız bu kare
   * görünür olması gerekenler (rbush sorgusu) + önceki karede görünür olanlar dolaşılır; tüm 500k
   * entity DEĞİL. Spatial index'in amacı buydu (Y2). Görünürlüğü değişmeyen objeye dokunulmaz.
   */
  cull(viewport: AABB): void {
    this.lastViewport = viewport;
    const candidates = this.index.search(viewport);
    // Yeniden kullanılan tampon (her karede yeni Set ayırma → GC baskısı yok, 500k için kritik).
    const nowVisible = this.cullBuffer;
    nowVisible.clear();
    for (const id of candidates) {
      const objs = this.objects.get(id);
      if (!objs) continue;
      if (this.layers.isHidden(this.store.get(id)?.layerId ?? '')) continue; // viewport'ta ama katmanı gizli
      nowVisible.add(id);
      for (const o of objs) o.visible = true;
    }
    // Önceki karede görünür olup artık görünmeyenleri (viewport'tan çıkan/gizlenen) kapat.
    for (const id of this.prevVisible) {
      if (nowVisible.has(id)) continue;
      const objs = this.objects.get(id);
      if (objs) for (const o of objs) o.visible = false;
    }
    // prevVisible ↔ cullBuffer takas: bu karenin görünürleri sonrakinin "önceki"si olur; eski set tampon olur.
    this.cullBuffer = this.prevVisible;
    this.prevVisible = nowVisible;
  }

  destroy(): void {
    this.unsubscribe();
    this.unsubscribeLayers();
    for (const objs of this.objects.values()) for (const o of objs) o.destroy({ children: true }); // Container'lar (yorum/pafta) çocuklarıyla yok edilsin (sızıntı önle)
    this.objects.clear();
    this.index.clear();
    this.container.destroy({ children: true });
  }
}
