/**
 * 営業管理の定数（管理画面要件定義書 11〜12章）
 *
 * 営業ステータスはコード側の固定値。サーバー側（functions/api/admin/*）と
 * フロント（src/admin/*）の両方がここを参照し、受け入れ可能な値の唯一の定義とする。
 *
 * 担当営業は D1 の sales_users テーブルで管理する（管理画面から追加・編集可能）。
 * このファイルには「未割り当て」を表す予約語と入力上限のみを置く。
 */

/** 営業ステータスの名称（ダッシュボード集計から参照するための別名） */
export const SALES_STATUS = {
  NOT_CALLED: '未架電',
  CALLED: '架電済み',
  NO_ANSWER: '不通',
  RECALL: '再架電',
  APPOINTMENT: '面談予約',
  LOST: '失注',
  WON: '成約',
} as const;

/** 営業ステータス（表示順 / 先頭が初期値） */
export const SALES_STATUSES = [
  SALES_STATUS.NOT_CALLED,
  SALES_STATUS.CALLED,
  SALES_STATUS.NO_ANSWER,
  SALES_STATUS.RECALL,
  SALES_STATUS.APPOINTMENT,
  SALES_STATUS.LOST,
  SALES_STATUS.WON,
] as const;

export type SalesStatus = (typeof SALES_STATUSES)[number];

/** 営業ステータスの初期値 */
export const DEFAULT_SALES_STATUS: SalesStatus = SALES_STATUS.NOT_CALLED;

/**
 * 「担当者が割り当てられていない」ことを表す予約語。
 * sales_users には登録せず、リード側の既定値（migration 0002）としてのみ使う。
 */
export const UNASSIGNED_SALES = '未設定';

export function isSalesStatus(value: unknown): value is SalesStatus {
  return typeof value === 'string' && (SALES_STATUSES as readonly string[]).includes(value);
}

/** 営業メモの最大文字数（サーバー側の検証と表示の両方で使用する） */
export const MAX_NOTE_LENGTH = 2000;

/** 営業担当者の入力上限 */
export const MAX_SALES_USER_NAME_LENGTH = 40;
export const MAX_SALES_USER_EMAIL_LENGTH = 120;

/**
 * 担当営業プルダウンの選択肢を組み立てる。
 *
 * 無効化された担当者は選択肢に出さないが、そのリードに現在割り当てられている場合だけは
 * 末尾に残す（選択値が表示から消えて、保存時に意図せず担当が変わるのを防ぐ）。
 */
export function salesPersonOptions(activeNames: readonly string[], current?: string): string[] {
  const options = [UNASSIGNED_SALES, ...activeNames];
  if (current && !options.includes(current)) options.push(current);
  return options;
}
