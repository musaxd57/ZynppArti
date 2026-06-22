'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Hata olduğunda gösterilecek etiket (varsayılan: tüm uygulama). */
  label?: string;
}
interface State {
  error: Error | null;
}

/**
 * React Error Boundary: bir bileşen render sırasında patlarsa tüm uygulamanın beyaz ekran olmasını
 * engeller; yerine Türkçe bir hata kartı + "yeniden dene" gösterir. (10-agent denetimi: app'te hiç
 * error boundary yoktu → tek bir render hatası her şeyi düşürüyordu.)
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary yakaladı:', error, info.componentStack);
  }

  private reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-900 p-6 text-center text-white">
          <div className="text-lg font-semibold">
            {this.props.label ?? 'Bir şeyler ters gitti'}
          </div>
          <div className="max-w-md text-sm text-white/70">{this.state.error.message}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="rounded bg-white/10 px-4 py-2 hover:bg-white/20"
            >
              Yeniden dene
            </button>
            <button
              type="button"
              onClick={() => location.reload()}
              className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
            >
              Sayfayı yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
