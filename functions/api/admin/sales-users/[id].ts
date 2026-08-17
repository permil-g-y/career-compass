/**
 * 営業担当者マスタの更新 API（管理画面専用）
 *
 *   PATCH /api/admin/sales-users/:id  … 名前 / メールアドレス / 有効・無効の変更
 *
 * 担当者は物理削除しない。退職時は is_active = 0 で無効化する。
 *
 * 名前を変更した場合は、既存リード（diagnoses.assigned_sales）と
 * 営業履歴（sales_activities.sales_person）の担当者名も同じトランザクションで
 * 追従させ、マスタに存在しない担当者名が残らないようにする。
 *
 * 認証は functions/api/admin/_middleware.ts で完了している。
 */
import {
  ERROR_BAD_REQUEST,
  ERROR_NOT_FOUND,
  ERROR_SERVER,
  errorResponse,
  json,
  readJsonBody,
} from '../../../lib/http';
import {
  findSalesUserById,
  findSalesUserByName,
  listSalesUsers,
  normalizeSalesUserEmail,
  normalizeSalesUserName,
} from '../../../lib/salesUsers';
import type { Env, PagesFunction } from '../../../types';

const ERROR_DUPLICATE = 'duplicate name';

function asId(value: unknown): number | null {
  const raw = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : null;
  if (typeof raw !== 'string' || !/^[0-9]{1,12}$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const id = asId(context.params.id);
  if (id === null) return errorResponse(ERROR_BAD_REQUEST, 400);

  const body = await readJsonBody(context.request);
  if (!body) return errorResponse(ERROR_BAD_REQUEST, 400);

  // 更新できるのはこの3項目のみ（カラム名は静的 / 値は bind）
  const assignments: string[] = [];
  const binds: unknown[] = [];
  let nextName: string | null = null;

  if ('name' in body) {
    nextName = normalizeSalesUserName(body.name);
    if (!nextName) return errorResponse(ERROR_BAD_REQUEST, 400);
    assignments.push('name = ?');
    binds.push(nextName);
  }

  if ('email' in body) {
    const email = normalizeSalesUserEmail(body.email);
    if (email === undefined) return errorResponse(ERROR_BAD_REQUEST, 400);
    assignments.push('email = ?');
    binds.push(email);
  }

  if ('is_active' in body) {
    if (typeof body.is_active !== 'boolean') return errorResponse(ERROR_BAD_REQUEST, 400);
    assignments.push('is_active = ?');
    binds.push(body.is_active ? 1 : 0);
  }

  if (!assignments.length) return errorResponse(ERROR_BAD_REQUEST, 400);

  if (!context.env.DB) {
    console.error('D1 binding is unavailable');
    return errorResponse(ERROR_SERVER, 500);
  }

  const db = context.env.DB;

  try {
    const current = await findSalesUserById(db, id);
    if (!current) return errorResponse(ERROR_NOT_FOUND, 404);

    if (nextName && nextName !== current.name) {
      const duplicated = await findSalesUserByName(db, nextName);
      if (duplicated) return errorResponse(ERROR_DUPLICATE, 409);
    }

    assignments.push('updated_at = ?');
    binds.push(new Date().toISOString());

    const statements = [
      db.prepare(`UPDATE sales_users SET ${assignments.join(', ')} WHERE id = ?`).bind(...binds, id),
    ];

    // 改名時は既存リード・営業履歴の担当者名も追従させる
    if (nextName && nextName !== current.name) {
      statements.push(
        db
          .prepare('UPDATE diagnoses SET assigned_sales = ? WHERE assigned_sales = ?')
          .bind(nextName, current.name),
        db
          .prepare('UPDATE sales_activities SET sales_person = ? WHERE sales_person = ?')
          .bind(nextName, current.name),
      );
    }

    await db.batch(statements);

    const users = await listSalesUsers(db);
    return json({ sales_users: users });
  } catch (error) {
    console.error('sales user update failed:', error instanceof Error ? error.name : 'unknown');
    return errorResponse(ERROR_SERVER, 500);
  }
};
