/**
 * リードの人物単位（ユニーク電話番号）集約。
 *
 * 成果報酬でのリード獲得を「回答数」ではなく「実際のユニークリード数」で
 * 把握するため、同一電話番号の複数回答を1人へまとめて扱う。
 *
 * 設計方針:
 * - **D1 のデータは一切変更しない。** diagnoses をそのまま source of truth とし、
 *   SELECT 側（この モジュール）でのみユニーク化・集約する。
 *   そのため本番で新しい回答が増え続けても、常に最新状態が一覧・集計へ追従する。
 * - 集計バッチ・重複排除テーブル・migration のいずれも使わない。
 * - SQL は静的文字列 + bind のみ。値を SQL へ連結する箇所は無い。
 */
import type { D1Database } from '../types';

/**
 * 電話番号の正規化キー（表記揺れの吸収）。
 *
 * 保存API（functions/api/diagnoses.ts）が既に数字のみへ正規化しているため
 * 現行データはすべて数字のみだが、過去データや手動投入に備えて
 * ハイフン・空白・括弧・プラスを SQL 側でも除去する。
 *
 *   090-1234-5678 / 09012345678 / 090 1234 5678 → いずれも 09012345678
 */
export const PHONE_KEY = `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  phone, '-', ''), '－', ''), 'ー', ''), '‐', ''), ' ', ''), '　', ''), '(', ''), ')', ''), '+', '')`;

/**
 * 人物単位のビュー（CTE）。
 *
 *   answer_rank = 1 … 診断内容の代表行（最新回答）
 *   sales_rank  = 1 … 営業情報の代表行（直近に更新された行 / 未更新は最後）
 *
 * 営業情報を「最新回答の行」ではなく「直近に更新された行」から取るのが要点。
 * 同じ人が再回答して新しい行が増えても、営業ステータスや担当が
 * 初期値（未架電 / 未設定）へ巻き戻らない。
 */
export const PERSON_CTE = `WITH base AS (
  SELECT
    ${PHONE_KEY} AS phone_key,
    diagnosis_id, created_at, name, phone, graduation_year, overall_grade, career_type,
    sales_status, assigned_sales, last_contacted_at, next_contact_at, updated_at
  FROM diagnoses
),
agg AS (
  SELECT
    phone_key,
    COUNT(*)        AS answer_count,
    MIN(created_at) AS first_answered_at,
    MAX(created_at) AS last_answered_at
  FROM base
  GROUP BY phone_key
),
ranked AS (
  SELECT
    base.*,
    ROW_NUMBER() OVER (
      PARTITION BY phone_key
      ORDER BY created_at DESC, diagnosis_id DESC
    ) AS answer_rank,
    ROW_NUMBER() OVER (
      PARTITION BY phone_key
      ORDER BY (updated_at IS NULL) ASC, updated_at DESC, created_at DESC, diagnosis_id DESC
    ) AS sales_rank
  FROM base
),
person AS (
  SELECT
    rep.diagnosis_id,
    rep.created_at,
    rep.name,
    rep.phone,
    rep.graduation_year,
    rep.overall_grade,
    rep.career_type,
    sales.sales_status,
    sales.assigned_sales,
    sales.last_contacted_at,
    sales.next_contact_at,
    agg.answer_count,
    agg.first_answered_at,
    agg.last_answered_at
  FROM ranked AS rep
  JOIN agg   ON agg.phone_key = rep.phone_key
  JOIN ranked AS sales ON sales.phone_key = rep.phone_key AND sales.sales_rank = 1
  WHERE rep.answer_rank = 1
)`;

/** 一覧が返すカラム（人物単位） */
export const PERSON_COLUMNS = [
  'diagnosis_id',
  'created_at',
  'name',
  'phone',
  'graduation_year',
  'overall_grade',
  'career_type',
  'sales_status',
  'assigned_sales',
  'last_contacted_at',
  'next_contact_at',
  'answer_count',
  'first_answered_at',
  'last_answered_at',
].join(', ');

/**
 * 並び替え（人物単位）。固定の候補からのみ選択する。
 * 「新着順」は最新回答、「古い順」は初回回答を基準にする。
 */
const PERSON_ORDER_BY: Record<string, string> = {
  newest: 'last_answered_at DESC, diagnosis_id DESC',
  oldest: 'first_answered_at ASC, diagnosis_id ASC',
  next_contact:
    'CASE WHEN next_contact_at IS NULL THEN 1 ELSE 0 END, next_contact_at ASC, last_answered_at DESC',
};

export function personOrderByClause(sort: unknown): string {
  const key = typeof sort === 'string' ? sort : '';
  return PERSON_ORDER_BY[key] ?? PERSON_ORDER_BY.newest;
}

/* ------------------------------------------------------------------ *
 * リード詳細（人物単位の付随情報）
 * ------------------------------------------------------------------ */

/** 1人あたりに返す回答履歴の上限 */
export const MAX_ANSWER_HISTORY = 50;

/** 同一電話番号の回答履歴（新しい順） */
const ANSWER_HISTORY_SQL = `SELECT diagnosis_id, created_at, overall_score, overall_grade, career_type
FROM diagnoses
WHERE ${PHONE_KEY} = (SELECT ${PHONE_KEY} FROM diagnoses WHERE diagnosis_id = ?)
ORDER BY created_at DESC, diagnosis_id DESC
LIMIT ${MAX_ANSWER_HISTORY}`;

/** 同一電話番号の営業情報（直近に更新された行を代表とする） */
const PERSON_SALES_SQL = `SELECT sales_status, assigned_sales, last_contacted_at, next_contact_at, updated_at
FROM diagnoses
WHERE ${PHONE_KEY} = (SELECT ${PHONE_KEY} FROM diagnoses WHERE diagnosis_id = ?)
ORDER BY (updated_at IS NULL) ASC, updated_at DESC, created_at DESC, diagnosis_id DESC
LIMIT 1`;

/** 同一電話番号に紐づくすべての diagnosis_id の営業履歴 */
const PERSON_ACTIVITIES_SQL = `SELECT id, sales_person, status, note, contacted_at, created_at
FROM sales_activities
WHERE diagnosis_id IN (
  SELECT diagnosis_id FROM diagnoses
  WHERE ${PHONE_KEY} = (SELECT ${PHONE_KEY} FROM diagnoses WHERE diagnosis_id = ?)
)
ORDER BY contacted_at DESC, id DESC
LIMIT 200`;

export interface AnswerHistoryRow {
  diagnosis_id: string;
  created_at: string;
  overall_score: number | null;
  overall_grade: string | null;
  career_type: string | null;
}

export interface PersonSalesRow {
  sales_status: string;
  assigned_sales: string;
  last_contacted_at: string | null;
  next_contact_at: string | null;
  updated_at: string | null;
}

export async function fetchAnswerHistory(
  db: D1Database,
  diagnosisId: string,
): Promise<AnswerHistoryRow[]> {
  const result = await db.prepare(ANSWER_HISTORY_SQL).bind(diagnosisId).all<AnswerHistoryRow>();
  return result.results ?? [];
}

export async function fetchPersonSales(
  db: D1Database,
  diagnosisId: string,
): Promise<PersonSalesRow | null> {
  return db.prepare(PERSON_SALES_SQL).bind(diagnosisId).first<PersonSalesRow>();
}

export async function fetchPersonActivities(
  db: D1Database,
  diagnosisId: string,
): Promise<Record<string, unknown>[]> {
  const result = await db
    .prepare(PERSON_ACTIVITIES_SQL)
    .bind(diagnosisId)
    .all<Record<string, unknown>>();
  return result.results ?? [];
}

/* ------------------------------------------------------------------ *
 * 営業情報の更新（人物単位）
 * ------------------------------------------------------------------ */

/**
 * 営業管理カラムの更新対象を「同一電話番号のすべての行」にするための WHERE 句。
 *
 * 更新するのは 0002 で追加した営業管理カラムのみで、
 * 診断原本（Q1〜Q10・氏名・判定など）には一切触れない。
 * 対象行は同一人物の回答のみ（実データでは最大3行）。
 *
 * 存在しない diagnosis_id を渡した場合はサブクエリが NULL となり0行更新になる。
 */
export const PERSON_SCOPE_WHERE = `${PHONE_KEY} = (SELECT ${PHONE_KEY} FROM diagnoses WHERE diagnosis_id = ?)`;
