import { AddEntity, History, createEntityId, type EntityStore } from '@zynpparti/document';

/**
 * GEÇİCİ: 1B'yi görsel doğrulamak için birkaç demo duvar ekler (birim: cm).
 * 1C'de interaktif çizim araçları gelince bu kaldırılacak.
 */
export function seedDemo(store: EntityStore): void {
  const history = new History(store);
  const thickness = 15;

  const wall = (x1: number, y1: number, x2: number, y2: number): void => {
    history.dispatch(
      new AddEntity({
        id: createEntityId(),
        type: 'wall',
        layerId: 'default',
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness,
      }),
    );
  };

  // 5m x 4m dış oda (cm cinsinden)
  wall(-250, -200, 250, -200);
  wall(250, -200, 250, 200);
  wall(250, 200, -250, 200);
  wall(-250, 200, -250, -200);
  // iç bölme
  wall(0, -200, 0, 50);
}
