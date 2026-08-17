/**
 * 営業担当者マスタ（sales_users）のサーバー側共通処理。
 *
 * 担当営業は diagnoses.assigned_sales / sales_activities.sales_person へ
 * 「名前」で保存されている（既存データの方式を維持する）。
 * このモジュールは、その名前がマスタに存在するかの検証と、
 * マスタ自体の読み書きに使う SQL を集約する。
 *
 * SQL は静的文字列 + bind のみ。値を SQL へ連結する箇所は無い。
 */
import {
  MAX_SALES_USER_EMAIL_LENGTH,
  MAX_SALES_USER_NAME_LENGTH,
  UNASSIGNED_SALES,
} from '../../src/admin/config/sales';
import type { D1Database } from '../types';

export { UNASSIGNED_SALES };

export interface SalesUserRow {
  id: number;
  name: string;
  email: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const COLUMNS = 'id, name, email, is_active, created_at, updated_at';

/** 一覧（有効な担当者を先頭に、名前順） */
const LIST_SQL = `SELECT ${COLUMNS} FROM sales_users ORDER BY is_active DESC, name ASC`;

/** プルダウン用（有効な担当者のみ） */
const LIST_ACTIVE_SQL = `SELECT ${COLUMNS} FROM sales_users WHERE is_active = 1 ORDER BY name ASC`;

export async function listSalesUsers(
  db: D1Database,
  options: { activeOnly?: boolean } = {},
): Promise<SalesUserRow[]> {
  const result = await db
    .prepare(options.activeOnly ? LIST_ACTIVE_SQL : LIST_SQL)
    .all<SalesUserRow>();
  return result.results ?? [];
}

export async function findSalesUserById(
  db: D1Database,
  id: number,
): Promise<SalesUserRow | null> {
  return db.prepare(`SELECT ${COLUMNS} FROM sales_users WHERE id = ?`).bind(id).first<SalesUserRow>();
}

export async function findSalesUserByName(
  db: D1Database,
  name: string,
): Promise<SalesUserRow | null> {
  return db
    .prepare(`SELECT ${COLUMNS} FROM sales_users WHERE name = ?`)
    .bind(name)
    .first<SalesUserRow>();
}

/**
 * リード・営業履歴へ設定してよい担当者名か。
 *
 * 「未設定」またはマスタに存在する名前のみ許可する。
 * 無効化済み（is_active = 0）の担当者も許可するのは、既に割り当て済みのリードを
 * 保存し直したときに 400 にしないため。新規の割り当てはプルダウンに出ないため発生しない。
 */
export async function isAssignableSalesPerson(db: D1Database, name: string): Promise<boolean> {
  if (name === UNASSIGNED_SALES) return true;
  return (await findSalesUserByName(db, name)) !== null;
}

/** 担当者名の検証（空・長すぎ・予約語を弾く） */
export function normalizeSalesUserName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_SALES_USER_NAME_LENGTH) return null;
  // 「未設定」は未割り当てを表す予約語のため担当者名には使わせない
  if (trimmed === UNASSIGNED_SALES) return null;
  return trimmed;
}

/** メールアドレスの検証（任意項目。空文字は未設定扱い） */
export function normalizeSalesUserEmail(value: unknown): string | null | undefined {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_SALES_USER_EMAIL_LENGTH) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}
