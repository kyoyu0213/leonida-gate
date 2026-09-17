import { useEffect, useState } from "react";

/**
 * ソフトキーボードが画面下からどれだけ入力欄に被っているか（px）を返す。
 *
 * iOS Safari は position:fixed の要素を「レイアウトビューポート」の下端に
 * 貼り付けたままにするため、キーボードが出ると画面下の返信ボックスが
 * キーボードの裏に隠れたり、中途半端な位置に取り残されたりする。
 * visualViewport でキーボードが食っている高さを測り、その分だけ
 * 返信ボックスを持ち上げるために使う。
 *
 * Android Chrome は index.html の viewport に付けた
 * `interactive-widget=resizes-content` によってレイアウト自体が縮むので、
 * ここでは 0 が返る（＝二重に持ち上げない）。
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      // ピンチズーム中も visualViewport は小さくなるが、これはキーボードではない
      if (vv.scale > 1.01) {
        setInset(0);
        return;
      }
      const overlap = window.innerHeight - (vv.height + vv.offsetTop);
      // 数十pxのズレは URL バーの伸縮などの誤差。キーボードは必ずもっと高い。
      // 万一の計算ミスで画面外へ飛ばさないよう上限も切っておく。
      const next =
        overlap > 80
          ? Math.min(Math.round(overlap), window.innerHeight * 0.6)
          : 0;
      setInset(prev => (prev === next ? prev : next));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
    };
  }, []);

  return inset;
}
