import { describe, it, expect } from 'vitest';
import { buildRenderProviders, resolveRenderChain, parseForcedRenderProvider } from './render-providers';
import type { RenderProviderName } from './render-types';

const names = (env: Parameters<typeof buildRenderProviders>[0]): RenderProviderName[] =>
  Object.keys(buildRenderProviders(env)) as RenderProviderName[];

describe('buildRenderProviders (env-gate)', () => {
  it('anahtar yoksa HİÇ sağlayıcı kurulmaz (sıfır-maliyet)', () => {
    expect(names({})).toEqual([]);
  });

  it('yalnız OPENAI_API_KEY → yalnız openai (creative)', () => {
    expect(names({ OPENAI_API_KEY: 'sk-x' })).toEqual(['openai']);
  });

  it('REPLICATE_API_TOKEN → replicate kurulur (preserve)', () => {
    expect(names({ REPLICATE_API_TOKEN: 'r8_x' })).toEqual(['replicate']);
  });

  it('boş/whitespace anahtar sağlayıcı kurmaz', () => {
    expect(names({ OPENAI_API_KEY: '   ', REPLICATE_API_TOKEN: '' })).toEqual([]);
  });
});

describe('resolveRenderChain', () => {
  it('preserve modu anahtarsızken BOŞ zincir → 503 (env-gate)', () => {
    const avail = names({ OPENAI_API_KEY: 'sk-x' }); // yalnız openai
    expect(resolveRenderChain('preserve', avail)).toEqual([]);
    expect(resolveRenderChain('creative', avail)).toEqual(['openai']);
  });

  it('preserve modu replicate anahtarıyla → [replicate]', () => {
    const avail = names({ OPENAI_API_KEY: 'sk-x', REPLICATE_API_TOKEN: 'r8_x' });
    expect(resolveRenderChain('preserve', avail)).toEqual(['replicate']);
    expect(resolveRenderChain('creative', avail)).toEqual(['openai']);
  });

  it('forced sağlayıcı başa alınır (mevcutsa)', () => {
    const avail: RenderProviderName[] = ['openai', 'replicate'];
    expect(resolveRenderChain('preserve', avail, 'replicate')).toEqual(['replicate']);
    // creative tabanı yalnız openai içerir → forced replicate mevcut değilse elenir
    expect(resolveRenderChain('creative', avail, 'replicate')).toEqual(['openai']);
  });
});

describe('parseForcedRenderProvider', () => {
  it('geçerli adları çözer, geçersizi undefined yapar', () => {
    expect(parseForcedRenderProvider('replicate')).toBe('replicate');
    expect(parseForcedRenderProvider(' OpenAI ')).toBe('openai');
    expect(parseForcedRenderProvider('fal')).toBe('fal');
    expect(parseForcedRenderProvider('akash')).toBeUndefined();
    expect(parseForcedRenderProvider(undefined)).toBeUndefined();
  });
});
