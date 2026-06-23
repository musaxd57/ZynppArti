/**
 * Sağlayıcı-bağımsız AI adapter tipleri (ADR-0006). SUNUCU TARAFI paket — tarayıcıya girmez
 * (API anahtarı yalnız sunucuda; çağrılar Next.js route'undan yapılır). React/DOM/Pixi import etmez.
 *
 * Bu paket Faz 2'nin "doğal-dil copilot" ayağıdır (Fikir 1): kullanıcı serbest soru sorar, AI mevcut
 * deterministik bulgular + metrik + seçili bölge bağlamıyla cevaplar (RAG-lite). Maliyetli AI kapısı
 * (ADR-0019) açıldı; sağlayıcı `.env` ile seçilir (Anthropic varsayılan; OpenAI alternatif).
 */

export type ChatRole = 'user' | 'assistant';

/** Tek bir sohbet turu (kullanıcı/asistan). Sistem yönergesi ayrı (`ChatOptions.system`). */
export interface ChatMessage {
  readonly role: ChatRole;
  readonly content: string;
}

/** Bir mahalin copilot'a verilen kısa özeti. */
export interface RoomBrief {
  readonly name: string;
  readonly type?: string;
  readonly areaM2: number;
}

/** Deterministik copilot bulgusu (atıflı) — LLM bunları TEMEL alır, ölçü uydurmaz. */
export interface FindingBrief {
  readonly severity: string;
  readonly message: string;
  readonly citation: string;
}

/**
 * Copilot'a verilen proje bağlamı (RAG-lite). İstemci toplar, sunucu prompt'a gömer. Tümü isteğe
 * bağlı — boşsa AI yalnız genel bilgisiyle cevaplar (ve bunu belirtir).
 */
export interface CopilotContext {
  /** Mahaller: ad + tip + alan. */
  readonly rooms?: readonly RoomBrief[];
  /** Özet metrik satırları (toplam/net/brüt m², dağılım…), serbest metin. */
  readonly metrics?: readonly string[];
  /** Deterministik yönetmelik/uyum bulguları (atıflı). */
  readonly findings?: readonly FindingBrief[];
  /** Seçili entity özeti (varsa). */
  readonly selection?: string;
}

export type AiProviderName = 'anthropic' | 'openai' | 'akash';

/** Soru zorluk kademesi → sağlayıcı yönlendirmesi (router.ts). */
export type Tier = 'simple' | 'medium' | 'complex';

export interface ChatOptions {
  /** Sistem yönergesi (persona + bağlam). */
  readonly system?: string;
  /** Üretilecek azami yanıt token'ı. */
  readonly maxTokens?: number;
}

/** Sağlayıcı-bağımsız sohbet arabirimi. Her sağlayıcı kendi resmî SDK'sıyla uygular. */
export interface AiProvider {
  readonly name: AiProviderName;
  /** Hangi modelin kullanıldığı (loglama/teşhis). */
  readonly model: string;
  chat(messages: readonly ChatMessage[], opts: ChatOptions): Promise<string>;
  /**
   * Akışlı (streaming) sohbet: yanıt parçalarını `onDelta` ile yayar, sonunda tam metni döndürür.
   * İnteraktif copilot UX'i için (cevap kelime kelime akar).
   */
  chatStream(
    messages: readonly ChatMessage[],
    opts: ChatOptions,
    onDelta: (delta: string) => void,
  ): Promise<string>;
}
