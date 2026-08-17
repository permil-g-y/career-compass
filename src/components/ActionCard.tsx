import type { CSSProperties } from 'react';
import { COLORS, FONT_ROUNDED } from './theme';

interface Props {
  /** 表示番号（01/02/03） */
  no: string;
  title: string;
  text: string;
}

const TITLE_STYLE = {
  fontFamily: FONT_ROUNDED,
  fontWeight: 800,
  fontSize: 16.5,
  color: COLORS.text,
  lineHeight: 1.5,
  textWrap: 'pretty',
} as CSSProperties;

const TEXT_STYLE = {
  fontSize: 13,
  lineHeight: 1.95,
  color: '#4A5F7D',
  margin: '10px 0 0',
  textWrap: 'pretty',
} as CSSProperties;

/** 「今やるべき3つ」の1枚 */
export function ActionCard({ no, title, text }: Props) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: 18,
        boxShadow: '0 6px 16px rgba(150,110,20,.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            flex: 'none',
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: COLORS.yellow,
            color: '#5C4200',
            fontFamily: FONT_ROUNDED,
            fontWeight: 800,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {no}
        </span>
        <div style={TITLE_STYLE}>{title}</div>
      </div>
      <p style={TEXT_STYLE}>{text}</p>
    </div>
  );
}
