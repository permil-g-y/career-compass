import { COLORS, FONT_ROUNDED } from './theme';
import type { Grade } from '../types/diagnosis';

interface Props {
  grade: Grade;
  /** 外円の直径（px） */
  size?: number;
  /** 内円の直径（px） */
  innerSize?: number;
  /** 判定文字のサイズ（px） */
  fontSize?: number;
  /** 出現アニメーションを付けるか */
  animate?: boolean;
  shadow?: string;
}

/** A〜E判定を表示する二重円バッジ（簡易結果・詳細結果で共用） */
export function GradeBadge({
  grade,
  size = 150,
  innerSize = 118,
  fontSize = 64,
  animate = false,
  shadow,
}: Props) {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginTop: animate ? 12 : 16 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#FFF3D0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: shadow,
          animation: animate ? 'ccPop .5s cubic-bezier(.3,1.4,.5,1) both' : undefined,
        }}
      >
        <div
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `inset 0 0 0 4px ${COLORS.yellow}`,
          }}
        >
          <span
            style={{
              fontFamily: FONT_ROUNDED,
              fontWeight: 800,
              fontSize,
              lineHeight: 1,
              color: COLORS.blueDark,
            }}
          >
            {grade}
          </span>
        </div>
      </div>
    </div>
  );
}
