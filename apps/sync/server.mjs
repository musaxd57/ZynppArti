// ZynppArti — minimal gerçek-zamanlı senkron sunucusu (Faz 3, ADR-0004).
//
// y-websocket protokolü peer-simetriktir: bir mesajı aynı odadaki DİĞER istemcilere yayınlamak
// (broadcast relay) temel senkron + presence için yeterlidir. Resmî sunucu da özünde budur (+kalıcılık).
// Bu v1'de KALICILIK YOK: tüm istemciler ayrılırsa o odanın durumu kaybolur (model zaten istemcide,
// Kaydet/Aç ile saklanır). Üretimde kalıcı bir y-websocket sunucusu / commit-log otoritesi gelecek.
//
// Çalıştır:  pnpm sync   (varsayılan ws://localhost:1234)

import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT) || 1234;
const wss = new WebSocketServer({ port });

/** room adı → o odadaki bağlı soketler. */
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const room = decodeURIComponent((req.url || '/').slice(1).split('?')[0]) || 'default';
  let peers = rooms.get(room);
  if (!peers) rooms.set(room, (peers = new Set()));
  peers.add(ws);

  ws.on('message', (data, isBinary) => {
    for (const peer of peers) {
      if (peer !== ws && peer.readyState === peer.OPEN) peer.send(data, { binary: isBinary });
    }
  });

  ws.on('close', () => {
    peers.delete(ws);
    if (peers.size === 0) rooms.delete(room);
  });
});

console.log(`ZynppArti senkron sunucusu çalışıyor → ws://localhost:${port}`);
console.log('İki sekmede aynı "oda" linkini açınca çizim canlı paylaşılır.');
