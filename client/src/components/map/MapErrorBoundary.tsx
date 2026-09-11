// ============================================================================
//  地図枠だけを守る局所 ErrorBoundary。
//
//  2026-08-14 の障害（⑫）は、ルートの動的 import 失敗が最上位 ErrorBoundary まで上がり、
//  プリレンダ本文ごと全画面エラーに置き換わったことだった。地図チャンク（Leaflet）の
//  取得に失敗しても、ここで止めて枠の中にだけ再試行 UI を出す。説明・カテゴリ・
//  ピン一覧はルート本体（事前 import）側にあるので残る。
// ============================================================================
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 失敗時の文言と再試行ボタン。 */
  message: string;
  retryLabel: string;
  /** 再試行（呼び出し側が新しい lazy を作り直す）。 */
  onRetry: () => void;
  /** これが変わったらエラー状態を解除する。 */
  resetKey: number;
}

interface State {
  failed: boolean;
  resetKey: number;
}

export default class MapErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { failed: false, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error: unknown) {
    console.warn('[map] 地図の読み込みに失敗しました', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mt-map-fallback" role="alert">
        <p>{this.props.message}</p>
        <button type="button" onClick={this.props.onRetry}>
          {this.props.retryLabel}
        </button>
      </div>
    );
  }
}
