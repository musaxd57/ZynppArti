import { describe, it, expect } from 'vitest';
import { askCopilot, askCopilotStream } from './copilot';
import type { AiProvider, AiProviderName, ChatMessage, ChatOptions } from './types';

/** Sabit metin (veya boş) döndüren sahte sağlayıcı; çağrı sayısını da tutar. */
function fakeProvider(name: AiProviderName, reply: string): AiProvider & { calls: number } {
  const p = {
    name,
    model: `${name}-test`,
    calls: 0,
    async chat(_m: readonly ChatMessage[], _o: ChatOptions): Promise<string> {
      p.calls++;
      return reply;
    },
    async chatStream(
      _m: readonly ChatMessage[],
      _o: ChatOptions,
      onDelta: (d: string) => void,
    ): Promise<string> {
      p.calls++;
      if (reply.length > 0) onDelta(reply);
      return reply;
    },
  };
  return p;
}

const MSGS: ChatMessage[] = [{ role: 'user', content: 'merhaba' }];

describe('askCopilot boş-yanıt fallback', () => {
  it('boş yanıt veren sağlayıcıyı atlar, dolu yanıt vereni döndürür', async () => {
    const empty = fakeProvider('openai', '   ');
    const full = fakeProvider('anthropic', 'gerçek cevap');
    // Zincir openai→anthropic olacak şekilde forced ile openai'ı öne al (basit tier zaten openai-önce).
    const res = await askCopilot({ openai: empty, anthropic: full }, MSGS, {});
    expect(res.answer).toBe('gerçek cevap');
    expect(empty.calls).toBe(1); // boş döndü → denendi
    expect(full.calls).toBe(1); // fallback çağrıldı
  });

  it('tüm sağlayıcılar boşsa hata fırlatır', async () => {
    const a = fakeProvider('openai', '');
    const b = fakeProvider('anthropic', '  \n ');
    await expect(askCopilot({ openai: a, anthropic: b }, MSGS, {})).rejects.toThrow();
  });
});

describe('askCopilotStream boş-akış fallback', () => {
  it('hiç parça yaymayan sağlayıcıyı atlar', async () => {
    const empty = fakeProvider('openai', '');
    const full = fakeProvider('anthropic', 'akan cevap');
    let out = '';
    await askCopilotStream({ openai: empty, anthropic: full }, MSGS, {}, (d) => {
      out += d;
    });
    expect(out).toBe('akan cevap');
    expect(empty.calls).toBe(1);
    expect(full.calls).toBe(1);
  });
});
