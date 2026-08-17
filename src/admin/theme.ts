/**
 * 管理画面のデザイントークン（管理画面要件定義書 27〜28章）
 *
 * 診断アプリ（src/components/theme.ts）とは別物として管理する。
 * こちらは SaaS 管理画面・CRM 向けの、白背景 + ネイビー/ブルーの情報密度高めな配色。
 */

export const ADMIN_COLORS = {
  navy: '#14204F',
  navySoft: '#25376E',
  blue: '#1B66F5',
  blueDeep: '#0B3C91',
  blueBg: '#EEF4FF',
  text: '#16233A',
  textSub: '#41557F',
  textMuted: '#6F82A6',
  line: '#E2E8F5',
  lineSoft: '#EDF1F9',
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  rowHover: '#F7FAFF',
  green: '#1F9D5F',
  greenBg: '#E4F7EE',
  orange: '#C97A08',
  orangeBg: '#FFF2DF',
  purple: '#6B4FD8',
  purpleBg: '#F0ECFF',
  red: '#C0392B',
  redBg: '#FDECEC',
  grayBg: '#EEF1F7',
} as const;

/** 最大幅（PCファースト / 要件定義書 28章） */
export const ADMIN_MAX_WIDTH = 1440;

export const FONT_BASE =
  "'Noto Sans JP', system-ui, -apple-system, 'Segoe UI', sans-serif";

/** 営業ステータス → バッジ配色 */
export const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  未架電: { bg: ADMIN_COLORS.grayBg, fg: ADMIN_COLORS.textSub },
  架電済み: { bg: ADMIN_COLORS.blueBg, fg: ADMIN_COLORS.blue },
  不通: { bg: ADMIN_COLORS.orangeBg, fg: ADMIN_COLORS.orange },
  再架電: { bg: ADMIN_COLORS.purpleBg, fg: ADMIN_COLORS.purple },
  面談予約: { bg: ADMIN_COLORS.greenBg, fg: ADMIN_COLORS.green },
  失注: { bg: ADMIN_COLORS.redBg, fg: ADMIN_COLORS.red },
  成約: { bg: ADMIN_COLORS.green, fg: '#FFFFFF' },
};

/** 総合判定 A〜E → 配色 */
export const GRADE_COLORS: Record<string, { bg: string; fg: string }> = {
  A: { bg: ADMIN_COLORS.greenBg, fg: ADMIN_COLORS.green },
  B: { bg: ADMIN_COLORS.blueBg, fg: ADMIN_COLORS.blue },
  C: { bg: ADMIN_COLORS.orangeBg, fg: ADMIN_COLORS.orange },
  D: { bg: ADMIN_COLORS.redBg, fg: ADMIN_COLORS.red },
  E: { bg: ADMIN_COLORS.redBg, fg: ADMIN_COLORS.red },
};
