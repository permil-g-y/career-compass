import { FONT_ROUNDED } from './theme';

interface Props {
  /** 現在のステップ番号（1始まり） */
  step: number;
  total: number;
  /** 進捗率（0〜100） */
  percent: number;
}

/** ステップ番号 + プログレスバー */
export function ProgressBar({ step, total, percent }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 16 }}>
      <div
        style={{
          fontFamily: FONT_ROUNDED,
          fontWeight: 800,
          fontSize: 15,
          color: '#0B3C91',
          letterSpacing: '-.01em',
        }}
      >
        {step}
        <span style={{ color: '#A9BCD6', fontSize: 11.5 }}>/{total}</span>
      </div>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 999,
          background: '#E3EBF6',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(90deg,#1B66F5,#4C93FF)',
            transition: 'width .35s cubic-bezier(.4,1.3,.5,1)',
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}
