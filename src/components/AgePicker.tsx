import { COLORS, FONT_ROUNDED } from './theme';

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

/** 年齢入力（上下ボタンで選択） */
export function AgePicker({ value, min, max, onChange }: Props) {
  const stepper = (delta: number, label: string, rotate: boolean) => (
    <button
      type="button"
      onClick={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      aria-label={label}
      style={{
        border: 'none',
        background: 'transparent',
        color: COLORS.blue,
        fontSize: 20,
        padding: '8px 34px',
        lineHeight: 1,
        transform: rotate ? 'rotate(180deg)' : undefined,
      }}
    >
      ⌃
    </button>
  );

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '16px 0 6px',
      }}
    >
      <div
        style={{
          border: '2px solid #DCE8FA',
          borderRadius: 22,
          padding: '10px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#FCFDFF',
        }}
      >
        {stepper(1, '年齢を上げる', false)}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: FONT_ROUNDED,
              fontWeight: 800,
              fontSize: 54,
              color: COLORS.blueDark,
              lineHeight: 1.1,
            }}
          >
            {value}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#43618F' }}>歳</span>
        </div>
        {stepper(-1, '年齢を下げる', true)}
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: '#A9BCD6', marginTop: 12 }}>
        ※上下のボタンで年齢を選択してください
      </div>
    </div>
  );
}
