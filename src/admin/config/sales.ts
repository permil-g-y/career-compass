/**
 * 営業管理の可変マスタ（管理画面要件定義書 11〜12章）
 *
 * 営業ステータスと担当営業の一覧はこのファイルだけを書き換えれば変更できる。
 * サーバー側（functions/api/admin/*）とフロント（src/admin/*）の両方がここを参照し、
 * 受け入れ可能な値の唯一の定義とする。
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
 * 担当営業の簡易マスタ（先頭が初期値）。
 * 担当者の追加・変更はこの配列のみを編集する。
 */
export const SALES_PERSONS = ['未設定', '山田', '佐藤', '鈴木'] as const;

export type SalesPerson = (typeof SALES_PERSONS)[number];

/** 担当営業の初期値 */
export const DEFAULT_SALES_PERSON: SalesPerson = SALES_PERSONS[0];

export function isSalesStatus(value: unknown): value is SalesStatus {
  return typeof value === 'string' && (SALES_STATUSES as readonly string[]).includes(value);
}

export function isSalesPerson(value: unknown): value is SalesPerson {
  return typeof value === 'string' && (SALES_PERSONS as readonly string[]).includes(value);
}

/** 営業メモの最大文字数（サーバー側の検証と表示の両方で使用する） */
export const MAX_NOTE_LENGTH = 2000;
