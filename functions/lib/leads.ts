/**
 * リード一覧の検索条件組み立て（管理API共通）。
 *
 * SQL は必ず「静的な文字列 + bind」で構成する。
 * ユーザー入力を SQL 文字列へ連結する箇所は存在しない
 * （並び替えのみ、固定の候補から選択した定数を使う）。
 */
import type { D1Database } from '../types';

/** 一覧に返すカラム（氏名・電話番号は認証済み管理APIでのみ返す） */
export const LEAD_LIST_COLUMNS = [
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
].join(', ');

/** 並び替えは固定の候補からのみ選択する（文字列連結による注入を成立させない） */
const ORDER_BY: Record<string, string> = {
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
  // 次回対応が未設定のリードは末尾へ回す
  next_contact: 'CASE WHEN next_contact_at IS NULL THEN 1 ELSE 0 END, next_contact_at ASC, created_at DESC',
};

export function orderByClause(sort: unknown): string {
  const key = typeof sort === 'string' ? sort : '';
  return ORDER_BY[key] ?? ORDER_BY.newest;
}

/* ------------------------------------------------------------------ *
 * 日付（JST基準）
 * ------------------------------------------------------------------ */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** JST の「その日の 0:00」を UTC の ISO8601 文字列で返す */
function jstDayStartIso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day) - JST_OFFSET_MS).toISOString();
}

/** 今日（JST）の 0:00 を UTC の ISO8601 文字列で返す */
export function jstTodayStartIso(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return jstDayStartIso(jst.getUTCFullYear(), jst.getUTCMonth() + 1, jst.getUTCDate());
}

/** YYYY-MM-DD（JST）を UTC の ISO8601 文字列へ変換する。dayOffset=1 で翌日 0:00。 */
export function jstDateToIso(value: unknown, dayOffset = 0): string | null {
  if (typeof value !== 'string') return null;
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return jstDayStartIso(year, month, day + dayOffset);
}

/* ------------------------------------------------------------------ *
 * 絞り込み条件
 * ------------------------------------------------------------------ */

/** LIKE のワイルドカードをエスケープする（部分一致検索を成立させるため） */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function filterValue(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export interface LeadFilterInput {
  q?: unknown;
  status?: unknown;
  assigned?: unknown;
  graduation_year?: unknown;
  grade?: unknown;
  career_type?: unknown;
  date_from?: unknown;
  date_to?: unknown;
}

export interface BuiltFilter {
  /** "WHERE ..." もしくは空文字 */
  where: string;
  binds: unknown[];
}

/**
 * 絞り込み条件から WHERE 句と bind 値を組み立てる。
 * 値はすべて bind で渡し、SQL 文字列へは埋め込まない。
 */
export function buildLeadFilter(input: LeadFilterInput): BuiltFilter {
  const conditions: string[] = [];
  const binds: unknown[] = [];

  // フリーワード検索（氏名・電話番号）
  const keyword = filterValue(input.q, 60);
  if (keyword) {
    const digits = keyword.replace(/[^0-9]/g, '');
    if (digits) {
      conditions.push(`(name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\')`);
      binds.push(`%${escapeLike(keyword)}%`, `%${escapeLike(digits)}%`);
    } else {
      conditions.push(`name LIKE ? ESCAPE '\\'`);
      binds.push(`%${escapeLike(keyword)}%`);
    }
  }

  const status = filterValue(input.status, 20);
  if (status) {
    conditions.push('sales_status = ?');
    binds.push(status);
  }

  const assigned = filterValue(input.assigned, 40);
  if (assigned) {
    conditions.push('assigned_sales = ?');
    binds.push(assigned);
  }

  const graduationYear = filterValue(input.graduation_year, 40);
  if (graduationYear) {
    conditions.push('graduation_year = ?');
    binds.push(graduationYear);
  }

  const grade = filterValue(input.grade, 1);
  if (grade && /^[A-E]$/.test(grade)) {
    conditions.push('overall_grade = ?');
    binds.push(grade);
  }

  const careerType = filterValue(input.career_type, 60);
  if (careerType) {
    conditions.push('career_type = ?');
    binds.push(careerType);
  }

  const from = jstDateToIso(input.date_from);
  if (from) {
    conditions.push('created_at >= ?');
    binds.push(from);
  }

  const to = jstDateToIso(input.date_to, 1);
  if (to) {
    conditions.push('created_at < ?');
    binds.push(to);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    binds,
  };
}

/** 表示件数の上限（管理画面の一覧はページングで取得する） */
export const MAX_LIMIT = 200;
export const DEFAULT_LIMIT = 100;

export function asLimit(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

export function asOffset(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(Math.floor(parsed), 100000);
}

/** 診断ID の形式（一般公開API と同じ制約） */
export const DIAGNOSIS_ID_PATTERN = /^cc_[A-Za-z0-9-]{8,64}$/;

/** パスパラメータから診断IDを取り出す（形式が不正なら null） */
export function asDiagnosisId(value: unknown): string | null {
  const id = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : null;
  if (typeof id !== 'string' || !DIAGNOSIS_ID_PATTERN.test(id)) return null;
  return id;
}

/* ------------------------------------------------------------------ *
 * リード詳細
 * ------------------------------------------------------------------ */

/** 詳細で返すカラム（診断原本 + 営業管理カラム） */
export const LEAD_DETAIL_COLUMNS = [
  'diagnosis_id',
  'created_at',
  'age',
  'graduation_year',
  'q1',
  'q2',
  'q3',
  'q4',
  'q5',
  'q6',
  'q7',
  'q8',
  'q9',
  'q10',
  'name',
  'phone',
  'overall_score',
  'overall_grade',
  'career_type',
  'self_understanding',
  'gakuchika',
  'career_design',
  'company_selection',
  'application_preparation',
  'interview_preparation',
  'selection_experience',
  'roadmap_current_step',
  'weakness_1',
  'weakness_2',
  'weakness_3',
  'action_1',
  'action_2',
  'action_3',
  'sales_status',
  'assigned_sales',
  'last_contacted_at',
  'next_contact_at',
  'updated_at',
].join(', ');

/** 1リードあたりに返す営業履歴の上限 */
export const MAX_ACTIVITIES = 200;

const DETAIL_SQL = `SELECT ${LEAD_DETAIL_COLUMNS} FROM diagnoses WHERE diagnosis_id = ?`;

const ACTIVITIES_SQL = `SELECT id, sales_person, status, note, contacted_at, created_at
FROM sales_activities
WHERE diagnosis_id = ?
ORDER BY contacted_at DESC, id DESC
LIMIT ${MAX_ACTIVITIES}`;

/** 診断原本 + 営業管理情報 + 営業履歴をまとめて取得する */
export async function fetchLeadDetail(
  db: D1Database,
  diagnosisId: string,
): Promise<Record<string, unknown> | null> {
  const lead = await db.prepare(DETAIL_SQL).bind(diagnosisId).first<Record<string, unknown>>();
  if (!lead) return null;
  const activities = await db.prepare(ACTIVITIES_SQL).bind(diagnosisId).all<Record<string, unknown>>();
  return { ...lead, activities: activities.results ?? [] };
}
