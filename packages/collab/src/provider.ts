import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { EntityStore } from '@zynpparti/document';
import { EntitySync } from './sync';

export interface CollabHandle {
  readonly doc: Y.Doc;
  readonly provider: WebsocketProvider;
  readonly sync: EntitySync;
  /** Yjs awareness — presence (imleç/seçim/kullanıcı) için. */
  readonly awareness: WebsocketProvider['awareness'];
  destroy(): void;
}

/**
 * Bir EntityStore'u canlı işbirliğine bağlar (Faz 3): Y.Doc + WebSocket sağlayıcı + store aynası.
 * Aynı `room`a bağlanan istemciler çizimi paylaşır. Yalnız tarayıcıda kullanılır (WebSocket).
 *
 * `wsUrl` örn. `ws://localhost:1234` (yerel `pnpm sync` sunucusu) ya da dağıtımda bir y-websocket
 * sunucusu. Anahtar/gizli bilgi taşımaz; oda adı paylaşım kanalıdır.
 */
export function createCollab(store: EntityStore, wsUrl: string, room: string): CollabHandle {
  const doc = new Y.Doc();
  const provider = new WebsocketProvider(wsUrl, room, doc);
  const sync = new EntitySync(store, doc);
  return {
    doc,
    provider,
    sync,
    awareness: provider.awareness,
    destroy(): void {
      sync.destroy();
      provider.destroy();
      doc.destroy();
    },
  };
}
