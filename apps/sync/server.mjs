// ZynppArti — minimal gerçek-zamanlı senkron sunucusu (Faz 3, ADR-0004).
//
// y-websocket protokolü peer-simetriktir: bir mesajı aynı odadaki DİĞER istemcilere yayınlamak
// (broadcast relay) temel senkron + presence için yeterlidir. Resmî sunucu da özünde budur (+kalıcılık).
// Bu v1'de KALICILIK YOK: tüm istemciler ayrılırsa o odanın durumu kaybolur (model zaten istemcide,
// Kaydet/Aç ile saklanır). Üretimde kalıcı bir y-websocket sunucusu / commit-log otoritesi gelecek.
//
// GÜVENLİK (canlı, herkese açık WS): aşağıdaki korumalar denetim bulgusudur —
//  • maxPayload: tek devasa frame ile bellek/bant amplifikasyonunu engeller (hep açık).
//  • ALLOWED_ORIGINS (env, virgülle): set'liyse yalnız bu origin'lerden bağlantı kabul edilir
//    (cross-site WebSocket hijack + yabancı sitelerden bağlanma engellenir). Set DEĞİLSE eski davranış
//    (tüm origin'ler) korunur → mevcut canlı kurulumu KIRMAZ. Railway'de set edilince devreye girer.
//  • Heartbeat: yanıt vermeyen (yarı-açık) soketleri ping/pong ile ayıklar (zombi bağlantı sızıntısı).
//
// Çalıştır:  pnpm sync   (varsayılan ws://localhost:1234)

import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT) || 1234;
const MAX_PAYLOAD = 2 * 1024 * 1024; // 2 MB — Yjs update'leri çok küçük; bu cömert bir üst sınır
const HEARTBEAT_MS = 30_000;

// İzinli origin'ler (env ile opt-in). Boşsa kontrol yapılmaz (geriye uyum: mevcut canlı kurulum sürer).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const wss = new WebSocketServer({
  port,
  maxPayload: MAX_PAYLOAD,
  // verifyClient yalnız ALLOWED_ORIGINS set'liyse devreye girer; aksi halde undefined = herkese açık.
  verifyClient:
    allowedOrigins.length === 0
      ? undefined
      : (info) => {
          const origin = info.origin || info.req.headers.origin || '';
          const ok = allowedOrigins.includes(origin);
          if (!ok) console.warn(`Reddedilen WS origin: ${origin || '(yok)'}`);
          return ok;
        },
});

/** room adı → o odadaki bağlı soketler. */
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const room = decodeURIComponent((req.url || '/').slice(1).split('?')[0]) || 'default';
  let peers = rooms.get(room);
  if (!peers) rooms.set(room, (peers = new Set()));
  peers.add(ws);

  // Heartbeat: pong gelince canlı işaretle. Aşağıdaki interval yanıt vermeyenleri terminate eder.
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

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

// Yarı-açık/zombi soketleri ayıkla: her turda ping at; bir önceki turun ping'ine pong gelmemişse kapat.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {
      ws.terminate();
    }
  }
}, HEARTBEAT_MS);
wss.on('close', () => clearInterval(heartbeat));

console.log(`ZynppArti senkron sunucusu çalışıyor → ws://localhost:${port}`);
console.log(
  allowedOrigins.length > 0
    ? `Origin kısıtı aktif: ${allowedOrigins.join(', ')}`
    : 'Origin kısıtı YOK (ALLOWED_ORIGINS set edilmedi — tüm origin\'ler kabul ediliyor).',
);
console.log('İki sekmede aynı "oda" linkini açınca çizim canlı paylaşılır.');
