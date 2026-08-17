import type { CSSProperties } from 'react';
import { asset } from './theme';

interface Props {
  /** 表示幅（CSS値） */
  width: string;
  style?: CSSProperties;
}

/** Career Compass 正式ロゴ（ロックアップ）。縦横比は常に維持する。 */
export function Logo({ width, style }: Props) {
  return (
    <img
      src={asset('logo-lockup.png')}
      alt="Career Compass 就活現在地診断"
      style={{ display: 'block', width, height: 'auto', ...style }}
    />
  );
}
