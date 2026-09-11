/**
 * リード一覧 API（管理画面専用）
 *
 *   GET  /api/admin/leads   … 絞り込み条件をクエリ文字列で受け取る
 *   POST /api/admin/leads   … 絞り込み条件を JSON ボディで受け取る（フリーワード検索用）
 *
 * GET と POST の2種類を用意しているのは、氏名・電話番号によるフリーワード検索の
 * 検索語を URL（クエリ文字列）へ載せないため。個人情報を含み得る検索語は
 * 必ず POST のボディで送る（セキュリティ要件 25章）。
 *
 * 認証は functions/api/admin/_middleware.ts で完了している。
 */
import { SALES_STATUS } from '../../../../src/admin/config/sales';
import {
  ERROR_BAD_REQUEST,
  ERROR_SERVER,
  errorResponse,
  json,
  readJsonBody,
} from '../../../lib/http';
import {
  DEFAULT_LIMIT,
  asLimit,
  asOffset,
  buildLeadFilter,
  jstTodayStartIso,
  type LeadFilterInput,
} from '../../../lib/leads';
import {
  PERSON_COLUMNS,
  PERSON_CTE,
  personOrderByClause,
} from '../../../lib/personLeads';
import type { Env, PagesFunction } from '../../../types';

interface CountRow {
  total: number;
}

interface StatsRow {
  today_new: number;
  not_called: number;
  recall: number;
  appointment: number;
  unique_leads: number;
  total_answers: number;
}

/**
 * 上部サマリーは絞り込み条件に依存しない全体値を返す（管理画面要件定義書 8.2）。
 *
 * すべて「人物単位（ユニーク電話番号）」で数える。成果報酬でのリード獲得数を
 * 回答数ではなく実際のリード数で把握するため。
 *
 * today_new は「今日（JST）初めて登録された電話番号の人数」。
 * 昨日までに回答済みの人が今日再回答しても新規には数えない。
 *
 * ステータス名は簡易マスタ由来の定数で、値は bind で渡す。
 */
const STATS_SQL = `${PERSON_CTE}
SELECT
  SUM(CASE WHEN first_answered_at >= ? THEN 1 ELSE 0 END) AS today_new,
  SUM(CASE WHEN sales_status = ? THEN 1 ELSE 0 END) AS not_called,
  SUM(CASE WHEN sales_status = ? THEN 1 ELSE 0 END) AS recall,
  SUM(CASE WHEN sales_status = ? THEN 1 ELSE 0 END) AS appointment,
  COUNT(*) AS unique_leads,
  SUM(answer_count) AS total_answers
FROM person`;

const STATUS_NOT_CALLED = SALES_STATUS.NOT_CALLED;
const STATUS_RECALL = SALES_STATUS.RECALL;
const STATUS_APPOINTMENT = SALES_STATUS.APPOINTMENT;

async function listLeads(
  env: Env,
  input: LeadFilterInput & { sort?: unknown; limit?: unknown; offset?: unknown },
): Promise<Response> {
  if (!env.DB) {
    console.error('D1 binding is unavailable');
    return errorResponse(ERROR_SERVER, 500);
  }

  // 登録日の絞り込みは「初回回答日」を対象にする（今日の新規と同じ基準にそろえる）
  const filter = buildLeadFilter(input, { dateColumn: 'first_answered_at' });
  const order = personOrderByClause(input.sort);
  const limit = asLimit(input.limit ?? DEFAULT_LIMIT);
  const offset = asOffset(input.offset);

  try {
    // 同一電話番号の回答は1人1行へ集約したうえで絞り込み・並び替え・ページングする
    const listSql = `${PERSON_CTE}
SELECT ${PERSON_COLUMNS} FROM person ${filter.where} ORDER BY ${order} LIMIT ? OFFSET ?`;
    const countSql = `${PERSON_CTE}
SELECT COUNT(*) AS total FROM person ${filter.where}`;

    const [list, count, stats] = await Promise.all([
      env.DB.prepare(listSql)
        .bind(...filter.binds, limit, offset)
        .all(),
      env.DB.prepare(countSql)
        .bind(...filter.binds)
        .first<CountRow>(),
      env.DB.prepare(STATS_SQL)
        .bind(jstTodayStartIso(), STATUS_NOT_CALLED, STATUS_RECALL, STATUS_APPOINTMENT)
        .first<StatsRow>(),
    ]);

    return json({
      stats: {
        today_new: stats?.today_new ?? 0,
        not_called: stats?.not_called ?? 0,
        recall: stats?.recall ?? 0,
        appointment: stats?.appointment ?? 0,
        unique_leads: stats?.unique_leads ?? 0,
        total_answers: stats?.total_answers ?? 0,
      },
      leads: list.results ?? [],
      total: count?.total ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    // 個人情報・SQL断片は出力しない。種別のみ記録する。
    console.error('admin leads query failed:', error instanceof Error ? error.name : 'unknown');
    return errorResponse(ERROR_SERVER, 500);
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const param = (key: string): string | undefined => url.searchParams.get(key) ?? undefined;

  // GET では氏名・電話番号のフリーワード検索を受け付けない（URLへ個人情報を載せない）
  return listLeads(context.env, {
    status: param('status'),
    assigned: param('assigned'),
    graduation_year: param('graduation_year'),
    grade: param('grade'),
    career_type: param('career_type'),
    date_from: param('date_from'),
    date_to: param('date_to'),
    sort: param('sort'),
    limit: param('limit'),
    offset: param('offset'),
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await readJsonBody(context.request);
  if (!body) return errorResponse(ERROR_BAD_REQUEST, 400);
  return listLeads(context.env, body);
};
