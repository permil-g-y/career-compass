/**
 * デザイントークン（Claude Design 確定版の値をそのまま保持する）
 * 色・フォント・角丸などはここを唯一の参照元にする。
 */

export const FONT_ROUNDED = "'M PLUS Rounded 1c', sans-serif";
export const FONT_BASE = "'Noto Sans JP', sans-serif";

export const COLORS = {
  navy: '#131E4E',
  navyDeep: '#14204F',
  blueDark: '#0B3C91',
  blue: '#1B66F5',
  blueLight: '#4C93FF',
  blueSoft: '#57A0FF',
  text: '#16233A',
  textBody: '#33496B',
  textSub: '#40597C',
  textMuted: '#48607F',
  textFaint: '#7A8FAD',
  textPale: '#9DB2CE',
  line: '#E6EEFA',
  lineInput: '#E1EAF7',
  lineOption: '#E9EFF7',
  bgApp: '#FFFFFF',
  bgQuestion: '#F7FAFF',
  bgTrack: '#EDF2F9',
  yellow: '#FFC93C',
  yellowDeep: '#FFC800',
  green: '#34C77B',
  greenDeep: '#2FBE7E',
  orange: '#FFA726',
  red: '#EF6C6C',
  pink: '#D34C82',
  error: '#E5484D',
} as const;

/** 選択肢バッジのカラーパレット（並列選択肢用） */
export const OPTION_PALETTE = [
  '#FF7BA9',
  '#FFA726',
  '#34C77B',
  '#1B66F5',
  '#7C6BF0',
  '#00B8C4',
  '#E9556D',
  '#3FA9F5',
] as const;

/** 準備度スコアに応じたバー色 */
export function readinessColor(score: number): string {
  if (score >= 4) return COLORS.green;
  if (score >= 3) return COLORS.blue;
  if (score >= 2) return COLORS.orange;
  return COLORS.red;
}

/** public/assets 配下の画像パスを解決する */
export function asset(name: string): string {
  return `${import.meta.env.BASE_URL}assets/${name}`;
}
