import { COLORS, FONT_ROUNDED } from './theme';

interface Props {
  /** セクション番号（02〜05） */
  no: string;
  title: string;
}

/** 詳細結果の見出し（番号バッジ + タイトル） */
export function SectionHeading({ no, title }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          background: COLORS.blue,
          color: '#fff',
          fontSize: 11,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {no}
      </span>
      <span
        style={{
          fontFamily: FONT_ROUNDED,
          fontWeight: 800,
          fontSize: 18,
          color: COLORS.blueDark,
        }}
      >
        {title}
      </span>
    </div>
  );
}
