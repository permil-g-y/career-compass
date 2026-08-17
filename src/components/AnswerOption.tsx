import type { CSSProperties } from 'react';
import { COLORS, FONT_ROUNDED, OPTION_PALETTE } from './theme';

const LABEL_STYLE = { flex: 1, textWrap: 'pretty' } as CSSProperties;

interface Props {
  label: string;
  index: number;
  selected: boolean;
  /** scale = 番号バッジ / choice = ◆バッジ */
  variant: 'choice' | 'scale';
  onSelect: () => void;
}

/** 回答選択肢。選択済みは枠線・背景・チェックマークで表現する。 */
export function AnswerOption({ label, index, selected, variant, onSelect }: Props) {
  const isScale = variant === 'scale';
  const paletteColor = OPTION_PALETTE[index % OPTION_PALETTE.length];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="cc-press"
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        borderRadius: 14,
        padding: '13px 13px',
        fontSize: 14.5,
        fontWeight: 700,
        color: COLORS.text,
        lineHeight: 1.5,
        border: `2px solid ${selected ? COLORS.blue : COLORS.lineOption}`,
        background: selected ? '#F2F7FF' : '#FFFFFF',
      }}
    >
      <span
        style={{
          flex: 'none',
          width: 24,
          height: 24,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontFamily: FONT_ROUNDED,
          fontWeight: 800,
          color: selected ? '#fff' : isScale ? '#5C8FD6' : paletteColor,
          background: selected ? COLORS.blue : isScale ? '#EDF4FF' : `${paletteColor}1F`,
        }}
      >
        {isScale ? index + 1 : '◆'}
      </span>
      <span style={LABEL_STYLE}>{label}</span>
      <span
        style={{
          flex: 'none',
          width: 21,
          height: 21,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: '#fff',
          border: `2px solid ${selected ? COLORS.green : '#DCE5F0'}`,
          background: selected ? COLORS.green : 'transparent',
        }}
      >
        {selected ? '✓' : ''}
      </span>
    </button>
  );
}
