/**
 * 新規リード受付の上限判定（サーバー側）。
 *
 * 判定は D1 の diagnoses を source of truth として COUNT するだけで、
 * 既存データの UPDATE / DELETE は一切行わない。受付停止のための
 * テーブル追加・migration も不要。
 *
 * 電話番号の正規化は管理画面のユニークリード集計（personLeads.ts）と
 * 同じ式を使う。定義がずれると「管理画面では199人なのにLPは停止」の
 * ような不整合が起きるため、必ず共通の PHONE_KEY を参照する。
 */
import {
  INTAKE_MODE,
  LEAD_LIMIT,
  LEAD_LIMIT_GRACE,
  isAcceptingLeads,
} from '../../src/config/intake';
import { PHONE_KEY, normalizePhoneKey } from './personLeads';
import type { D1Database } from '../types';

export { INTAKE_MODE, LEAD_LIMIT, LEAD_LIMIT_GRACE };

/** ユニーク電話番号の人数 */
const UNIQUE_LEADS_SQL = `SELECT COUNT(DISTINCT ${PHONE_KEY}) AS unique_leads FROM diagnoses`;

/**
 * 保存APIの判定用。
 * ユニーク人数と、その電話番号が既に登録済みかを1往復で取得する。
 */
const INTAKE_CHECK_SQL = `SELECT
  (SELECT COUNT(DISTINCT ${PHONE_KEY}) FROM diagnoses) AS unique_leads,
  (SELECT COUNT(*) FROM diagnoses WHERE ${PHONE_KEY} = ?) AS existing_answers`;

interface UniqueLeadsRow {
  unique_leads: number;
}

interface IntakeCheckRow {
  unique_leads: number;
  existing_answers: number;
}

/** 診断LPへ返す受付可否（新規に診断を開始してよいか） */
export async function isIntakeOpen(db: D1Database): Promise<boolean> {
  if (INTAKE_MODE === 'open') return true;
  if (INTAKE_MODE === 'closed') return false;
  const row = await db.prepare(UNIQUE_LEADS_SQL).first<UniqueLeadsRow>();
  return isAcceptingLeads(row?.unique_leads ?? 0);
}

export type SaveDecision =
  | { allowed: true; reason: 'existing_lead' | 'within_limit' | 'mode_open' }
  | { allowed: false; reason: 'limit_reached' };

/**
 * 保存を受け付けてよいかを判定する。
 *
 * - 既に登録済みの電話番号（＝同一人物の再回答）は常に許可する。
 *   ユニーク人数が増えないため、上限の趣旨に反しない。
 * - 新規の電話番号は LEAD_LIMIT + LEAD_LIMIT_GRACE 未満のときだけ許可する。
 *   救済枠は「LP通過後に上限へ到達したユーザー」の送信を守るためのもの。
 *
 * 判定に失敗した場合は許可側へ倒す（受付を止めるより取りこぼさない方を優先）。
 */
export async function decideSave(db: D1Database, normalizedPhone: string): Promise<SaveDecision> {
  if (INTAKE_MODE === 'open') return { allowed: true, reason: 'mode_open' };

  // 受付を明示的に停止しているときは D1 を参照せずに拒否する。
  // D1 が読めない状況（障害・上限超過など）でも受付停止が確実に維持される。
  if (INTAKE_MODE === 'closed') return { allowed: false, reason: 'limit_reached' };

  // SQL 側（PHONE_KEY）と同じ規則で正規化してから比較する
  const row = await db
    .prepare(INTAKE_CHECK_SQL)
    .bind(normalizePhoneKey(normalizedPhone))
    .first<IntakeCheckRow>();
  if (!row) return { allowed: true, reason: 'within_limit' };

  // 同一人物の再回答はユニーク人数を増やさないため常に保存する
  if (row.existing_answers > 0) return { allowed: true, reason: 'existing_lead' };

  return row.unique_leads < LEAD_LIMIT + LEAD_LIMIT_GRACE
    ? { allowed: true, reason: 'within_limit' }
    : { allowed: false, reason: 'limit_reached' };
}
