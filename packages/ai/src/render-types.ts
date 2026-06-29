/**
 * Sağlayıcı-agnostik AI render arayüzü (copilot/design router deseninin render karşılığı).
 * İki mod: 'creative' (OpenAI text→image, geometri serbest — mevcut davranış) ve 'preserve'
 * (ControlNet; kontrol görseli + difüzyon ile plan/3B geometrisini koruyan render).
 *
 * SAF TS — SDK/DOM yok; yalnız tipler. (Sağlayıcı implementasyonları ayrı dosyalarda.)
 */

export type RenderProviderName = 'openai' | 'replicate' | 'fal';
export type RenderMode = 'creative' | 'preserve';
export type ControlType = 'depth' | 'canny' | 'mlsd';

export interface RenderInput {
  readonly prompt: string;
  readonly negativePrompt?: string;
  readonly mode: RenderMode;
  /** data:image/(png|jpeg);base64,… — yalnız preserve modunda (kontrol görseli). */
  readonly controlImage?: string;
  /** 3B snapshot → depth; temiz üstten plan → canny/mlsd. */
  readonly controlType?: ControlType;
  /** ControlNet koşul gücü (0.55 düşük / 0.75 orta / 0.9 yüksek sadakat). */
  readonly conditioningScale?: number;
  /** Difüzyon serbestlik derecesi (0.9 düşük-sadakat / 0.6 yüksek-sadakat). */
  readonly promptStrength?: number;
  /** Açık HD kademesi (flux; daha pahalı/yavaş, Pro önerilir). */
  readonly hd?: boolean;
}

export interface RenderResult {
  /** Gösterilebilir kaynak: data-url (rehost) veya http URL. */
  readonly image: string;
  readonly provider: RenderProviderName;
  readonly model: string;
}

export interface RenderProvider {
  readonly name: RenderProviderName;
  /** ControlNet (geometriyi koru) destekler mi? OpenAI text→image = false. */
  readonly supportsControl: boolean;
  generate(input: RenderInput, signal?: AbortSignal): Promise<RenderResult>;
}

/** Mod için anahtarlı sağlayıcı yok (env-gate) — çağıran 503'e çevirir. */
export class RenderUnavailableError extends Error {
  constructor(readonly mode: RenderMode) {
    super(`Render sağlayıcısı yok (mode=${mode}).`);
    this.name = 'RenderUnavailableError';
  }
}
