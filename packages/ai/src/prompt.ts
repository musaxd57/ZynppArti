import type { CopilotContext } from './types';

/**
 * Copilot persona + bağlam → sistem yönergesi (SAF, test edilebilir). Sağlayıcıdan bağımsız;
 * hem Anthropic (top-level `system`) hem OpenAI (system mesajı) bunu kullanır.
 *
 * İlke (AI-AGENT-VISION Seviye 1): salt-öneri, atıflı, uydurmasız. Türkçe yönetmelik farkındalığı
 * premium değer (FAZ2-NOTES §3) ama emin değilse hedge eder — can güvenliği konusunda palavra yasak.
 */
export const COPILOT_SYSTEM_BASE = [
  "Sen ZynppArti'nin mimari tasarım asistanısın (copilot).",
  'Tarayıcıda çalışan 2B mimari çizim aracında, kullanıcı (bir mimar) çizdiği plan hakkında Türkçe sorular sorar.',
  '',
  'KURALLAR:',
  '- Türkçe, kısa ve net cevap ver; gereksiz dolgu yapma.',
  '- Cevabını ÖNCELİKLE sana verilen PROJE BAĞLAMINA ve deterministik bulgulara dayandır.',
  '- Bağlamda olmayan ölçü/alan/sayı UYDURMA. Veri yoksa "çizimde bu bilgi yok" de.',
  '- Türk yönetmeliğinden (İmar/Planlı Alanlar, TBDY deprem, Otopark, TS 9111 erişilebilirlik) söz ederken:',
  '  emin değilsen kesin madde/rakam uydurma; "yürürlükteki yönetmelikten / imar planı notundan doğrula" uyarısı ekle.',
  '- Sen yalnızca ÖNERİ verirsin; çizimi sen değiştiremezsin (kullanıcı uygular).',
  '- Bilmiyorsan bilmediğini açıkça söyle. Sorumluluğu üstlenmezsin (Seviye 1 — salt öneri).',
].join('\n');

function fmtNum(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

/** Bağlamı insan-okur Türkçe bölümlere serileştirir (prompt'a gömülür). Boş bölümler atlanır. */
export function formatContext(ctx: CopilotContext): string {
  const parts: string[] = [];

  if (ctx.rooms && ctx.rooms.length > 0) {
    const lines = ctx.rooms.map(
      (r) => `- ${r.name}${r.type ? ` (${r.type})` : ''}: ${fmtNum(r.areaM2)} m²`,
    );
    parts.push(`MAHALLER (${ctx.rooms.length}):\n${lines.join('\n')}`);
  }

  if (ctx.metrics && ctx.metrics.length > 0) {
    parts.push(`METRİKLER:\n${ctx.metrics.map((m) => `- ${m}`).join('\n')}`);
  }

  if (ctx.findings && ctx.findings.length > 0) {
    const lines = ctx.findings.map((f) => `- [${f.severity}] ${f.message} (Kaynak: ${f.citation})`);
    parts.push(`DETERMİNİSTİK BULGULAR (atıflı; bunları temel al):\n${lines.join('\n')}`);
  }

  if (ctx.selection) parts.push(`SEÇİLİ: ${ctx.selection}`);

  return parts.join('\n\n');
}

/** Persona + (varsa) bağlam → tam sistem yönergesi. Bağlam boşsa yalnız persona döner. */
export function buildSystemPrompt(ctx: CopilotContext): string {
  const context = formatContext(ctx);
  if (!context) {
    return `${COPILOT_SYSTEM_BASE}\n\n(Çizimde henüz bağlam verisi yok — kullanıcı henüz mahal/duvar çizmemiş olabilir.)`;
  }
  return `${COPILOT_SYSTEM_BASE}\n\n=== PROJE BAĞLAMI ===\n${context}`;
}
