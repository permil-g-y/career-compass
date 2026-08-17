/**
 * 画面幅のブレークポイント判定（管理画面のレスポンシブ切り替え用）
 *
 *   PC     : 1024px 以上   … テーブル中心
 *   Tablet : 768〜1023px   … テーブル（横スクロール可）
 *   Mobile : 767px 以下    … カード中心・1カラム
 *
 * インラインスタイル主体のため、レイアウトの切り替えは CSS ではなく
 * このフックの判定で行う（表示要素そのものが変わるため）。
 */
import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export const MOBILE_MAX_WIDTH = 767;
export const TABLET_MAX_WIDTH = 1023;

function currentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width <= MOBILE_MAX_WIDTH) return 'mobile';
  if (width <= TABLET_MAX_WIDTH) return 'tablet';
  return 'desktop';
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(currentBreakpoint);

  useEffect(() => {
    const mobile = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const tablet = window.matchMedia(`(max-width: ${TABLET_MAX_WIDTH}px)`);
    const update = () => setBreakpoint(currentBreakpoint());

    mobile.addEventListener('change', update);
    tablet.addEventListener('change', update);
    // 端末の回転などで matchMedia が発火しないケースに備える
    window.addEventListener('resize', update);
    update();

    return () => {
      mobile.removeEventListener('change', update);
      tablet.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return breakpoint;
}

/** スマートフォン幅かどうか */
export function useIsMobile(): boolean {
  return useBreakpoint() === 'mobile';
}
