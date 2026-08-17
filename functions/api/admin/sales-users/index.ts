/**
 * 営業担当者マスタ API（管理画面専用）
 *
 *   GET  /api/admin/sales-users        … 一覧（?active=1 で有効な担当者のみ）
 *   POST /api/admin/sales-users        … 新規追加
 *
 * 認証は functions/api/admin/_middleware.ts で完了している。
 */
import {
  ERROR_BAD_REQUEST,
  ERROR_SERVER,
  errorResponse,
  json,
  readJsonBody,
} from '../../../lib/http';
import {
  findSalesUserByName,
  listSalesUsers,
  normalizeSalesUserEmail,
  normalizeSalesUserName,
} from '../../../lib/salesUsers';
import type { Env, PagesFunction } from '../../../types';

/** 名前が既に使われている場合のエラー（内部構造は明かさない） */
const ERROR_DUPLICATE = 'duplicate name';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    console.error('D1 binding is unavailable');
    return errorResponse(ERROR_SERVER, 500);
  }

  const activeOnly = new URL(context.request.url).searchParams.get('active') === '1';

  try {
    const users = await listSalesUsers(context.env.DB, { activeOnly });
    return json({ sales_users: users });
  } catch (error) {
    console.error('sales users query failed:', error instanceof Error ? error.name : 'unknown');
    return errorResponse(ERROR_SERVER, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await readJsonBody(context.request);
  if (!body) return errorResponse(ERROR_BAD_REQUEST, 400);

  const name = normalizeSalesUserName(body.name);
  if (!name) return errorResponse(ERROR_BAD_REQUEST, 400);

  const email = normalizeSalesUserEmail(body.email ?? null);
  if (email === undefined) return errorResponse(ERROR_BAD_REQUEST, 400);

  if (!context.env.DB) {
    console.error('D1 binding is unavailable');
    return errorResponse(ERROR_SERVER, 500);
  }

  try {
    // 名前は担当者の識別キーになるため重複させない
    if (await findSalesUserByName(context.env.DB, name)) {
      return errorResponse(ERROR_DUPLICATE, 409);
    }

    const now = new Date().toISOString();
    await context.env.DB.prepare(
      'INSERT INTO sales_users (name, email, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)',
    )
      .bind(name, email, now, now)
      .run();

    const users = await listSalesUsers(context.env.DB);
    return json({ sales_users: users }, 201);
  } catch (error) {
    console.error('sales user insert failed:', error instanceof Error ? error.name : 'unknown');
    return errorResponse(ERROR_SERVER, 500);
  }
};
