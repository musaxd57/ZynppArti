import { describe, it, expect } from 'vitest';
import { classifyTier, classifyDesignTier, resolveChain } from './router';

describe('classifyTier', () => {
  it('yönetmelik / akıl-yürütme → complex (Claude)', () => {
    expect(classifyTier('Bu plan imar yönetmeliğine uygun mu?')).toBe('complex');
    expect(classifyTier('Koridor TS 9111 açısından yeterli mi?')).toBe('complex');
    expect(classifyTier('Neden bu oda çok küçük?')).toBe('complex'); // "neden"
  });

  it('İmar (büyük İ, Türkçe locale) yakalanır', () => {
    expect(classifyTier('İmar açısından bir sorun var mı?')).toBe('complex');
  });

  it('ŞAPKASIZ (ASCII) Türkçe de yakalanır — kullanıcılar genelde böyle yazar', () => {
    expect(classifyTier('imar yonetmeligine uygun mu')).toBe('complex'); // şapkasız
    expect(classifyTier('koridor TS 9111 acisindan yeterli mi')).toBe('complex');
    const m = 'salonu mutfakla birlestirsem acik plan olarak nasil bir his verir genel olarak sence iyi mi olur';
    expect(m.length).toBeGreaterThanOrEqual(90);
    expect(classifyTier(m)).toBe('medium'); // 'nasil' (şapkasız) + uzunluk≥90
  });

  it('kısa / olgusal → simple (Akash)', () => {
    expect(classifyTier('Kaç oda var?')).toBe('simple');
    expect(classifyTier('Toplam m² ne kadar?')).toBe('simple');
    expect(classifyTier('Salonu listele')).toBe('simple');
  });

  it('orta-uzun, yönetmelik değil → medium (OpenAI)', () => {
    const q =
      'Bu dairenin genel yerleşimini biraz daha ferah göstermek için odaları yeniden nasıl düzenleyebilirim acaba sence';
    expect(q.length).toBeGreaterThanOrEqual(90);
    expect(classifyTier(q)).toBe('medium');
  });
});

describe('classifyDesignTier', () => {
  it('basit daire → simple (Akash-önce, ucuz)', () => {
    expect(classifyDesignTier('60 m² stüdyo daire')).toBe('simple');
    expect(classifyDesignTier('8x10 m 2+1 ev çiz')).toBe('simple');
  });

  it('gelişmiş/kısıtlı tasarım → complex (Claude-önce)', () => {
    expect(classifyDesignTier('villa, 5+1, çatı katı dahil')).toBe('complex');
    expect(classifyDesignTier('parsel içine çekme payıyla 4+1 daire')).toBe('complex');
    expect(classifyDesignTier('imar yönetmeliğine uygun ofis kat planı')).toBe('complex');
  });
});

describe('resolveChain', () => {
  it('mevcut sağlayıcılara göre filtreler, sırayı korur', () => {
    expect(resolveChain('simple', ['akash', 'anthropic', 'openai'])).toEqual([
      'akash',
      'anthropic',
      'openai',
    ]);
    // complex birincil anthropic ama anahtarı yok → elenir, akash'a düşer
    expect(resolveChain('complex', ['akash', 'openai'])).toEqual(['akash', 'openai']);
  });

  it('forced sağlayıcı (AI_PROVIDER) en başa alınır', () => {
    expect(resolveChain('simple', ['akash', 'openai', 'anthropic'], 'openai')).toEqual([
      'openai',
      'akash',
      'anthropic',
    ]);
  });

  it('forced sağlayıcının anahtarı yoksa elenir', () => {
    expect(resolveChain('simple', ['akash'], 'openai')).toEqual(['akash']);
  });
});
