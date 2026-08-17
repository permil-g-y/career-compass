import { COLORS, FONT_ROUNDED, readinessColor } from './theme';
import type { Grade } from '../types/diagnosis';

interface Props {
  label: string;
  /** 0〜100 */
  percent: number;
  /** 1.0〜5.0（バー色の決定に使用） */
  score: number;
  /** 未指定なら % 表記（ティザー用） */
  grade?: Grade;
  /** ラベル幅（px） */
  labelWidth?: number;
}

/** 就活準備度の1項目（ラベル + バー + 評価） */
export function ReadinessItem({ label, percent, score, grade, labelWidth = 76 }: Props) {
  const color = grade ? readinessColor(score) : COLORS.blueSoft;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: labelWidth,
          flex: 'none',
          fontSize: 12.5,
          fontWeight: 700,
          color: grade ? COLORS.textBody : COLORS.textSub,
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          height: grade ? 10 : 9,
          borderRadius: 999,
          background: COLORS.bgTrack,
          overflow: 'hidden',
          display: 'block',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            borderRadius: 999,
            animation: `ccGrow ${grade ? '.8s' : '.7s'} ease both`,
            width: `${percent}%`,
            background: color,
          }}
        />
      </span>
      {grade ? (
        <span
          style={{
            width: 24,
            textAlign: 'center',
            fontFamily: FONT_ROUNDED,
            fontWeight: 800,
            fontSize: 14,
            color,
          }}
        >
          {grade}
        </span>
      ) : (
        <span
          style={{
            width: 38,
            textAlign: 'right',
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.blue,
          }}
        >
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}
