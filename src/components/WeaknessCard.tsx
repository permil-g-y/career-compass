import type { CSSProperties } from 'react';
import { FONT_ROUNDED } from './theme';

interface Props {
  label: string;
  text: string;
}

const TEXT_STYLE = {
  fontSize: 13,
  lineHeight: 1.9,
  color: '#6B5257',
  margin: '6px 0 0',
  textWrap: 'pretty',
} as CSSProperties;

/** 「今のあなたに不足していること」の1枚 */
export function WeaknessCard({ label, text }: Props) {
  return (
    <div style={{ background: '#FFF7F7', borderRadius: 18, padding: '16px 18px' }}>
      <div
        style={{
          fontFamily: FONT_ROUNDED,
          fontWeight: 800,
          fontSize: 15.5,
          color: '#D0454A',
        }}
      >
        {label}
      </div>
      <p style={TEXT_STYLE}>{text}</p>
    </div>
  );
}
