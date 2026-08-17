import type { CSSProperties, ReactNode } from 'react';
import { COLORS, FONT_ROUNDED } from './theme';

interface Props {
  title: string;
  note?: string;
  children: ReactNode;
}

const TITLE_STYLE = {
  fontFamily: FONT_ROUNDED,
  fontWeight: 800,
  fontSize: 19.5,
  lineHeight: 1.55,
  margin: 0,
  color: COLORS.text,
  textWrap: 'pretty',
} as CSSProperties;

/** 設問カード（Qバッジ・設問文・補足・回答UIをまとめる） */
export function QuestionCard({ title, note, children }: Props) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 22,
        padding: '18px 16px 16px',
        marginTop: 16,
        boxShadow: '0 6px 20px rgba(20,60,140,.07)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', gap: 10 }}>
        <div
          style={{
            flex: 'none',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: COLORS.blue,
            color: '#fff',
            fontFamily: FONT_ROUNDED,
            fontWeight: 800,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          Q
        </div>
        <div>
          <h2 style={TITLE_STYLE}>{title}</h2>
          {note ? (
            <div style={{ fontSize: 11.5, color: '#8DA1BD', marginTop: 8 }}>{note}</div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
