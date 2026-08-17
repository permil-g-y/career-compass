/**
 * リード詳細 API（管理画面専用）
 *
 *   GET   /api/admin/leads/:id  … 診断原本 + 営業管理情報 + 営業履歴
 *   PATCH /api/admin/leads/:id  … 営業ステータス / 担当営業 / 次回対応日時の更新
 *
 * 診断原本（Q1〜Q10・判定・弱点など）は絶対に更新しない。
 * 更新できるのは 0002 で追加した営業管理カラムのみ。
 *
 * 認証は functions/api/admin/_middleware.ts で完了している。
 */
import { isSalesStatus, SALES_STATUS } from '../../../../src/admin/config/sales';
import {
  ERROR_BAD_REQUEST,
  ERROR_NOT_FOUND,
  ERROR_SERVER,
  asIsoDateTime,
  errorResponse,
  json,
  readJsonBody,
} from '../../../lib/http';
import { asDiagnosisId, fetchLeadDetail } from '../../../lib/leads';
import { isAssignableSalesPerson } from '../../../lib/salesUsers';
import type { Env, PagesFunction } from '../../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const diagnosisId = asDiagnosisId(context.params.id);
  if (!diagnosisId) return errorResponse(ERROR_BAD_REQUEST, 400);

  if (!context.env.DB) {
    console.error('D1 binding is unavailable');
    return errorResponse(ERROR_SERVER, 500);
  }

  try {
    const lead = await fetchLeadDetail(context.env.DB, diagnosisId);
    if (!lead) return errorResponse(ERROR_NOT_FOUND, 404);
    return json({ lead });
  } catch (error) {
    console.error('admin lead detail failed:', error instanceof Error ? error.name : 'unknown');
    return errorResponse(ERROR_SERVER, 500);
  }
};

/**
 * 更新できるカラムはここに列挙した3つのみ。
 * カラム名は静的な文字列で、値は必ず bind で渡す。
 */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const diagnosisId = asDiagnosisId(context.params.id);
  if (!diagnosisId) return errorResponse(ERROR_BAD_REQUEST, 400);

  const body = await readJsonBody(context.request);
  if (!body) return errorResponse(ERROR_BAD_REQUEST, 400);

  if (!context.env.DB) {
    console.error('D1 binding is unavailable');
    return errorResponse(ERROR_SERVER, 500);
  }

  const assignments: string[] = [];
  const binds: unknown[] = [];

  if ('sales_status' in body) {
    if (!isSalesStatus(body.sales_status)) return errorResponse(ERROR_BAD_REQUEST, 400);
    assignments.push('sales_status = ?');
    binds.push(body.sales_status);
    // 未架電以外へ変更された時点で「対応済み」とみなし最終対応日時を更新する
    if (body.sales_status !== SALES_STATUS.NOT_CALLED) {
      assignments.push('last_contacted_at = ?');
      binds.push(new Date().toISOString());
    }
  }

  if ('assigned_sales' in body) {
    // 担当営業は sales_users マスタ（または「未設定」）の値のみ受け付ける
    const assigned = body.assigned_sales;
    if (typeof assigned !== 'string' || !(await isAssignableSalesPerson(context.env.DB, assigned))) {
      return errorResponse(ERROR_BAD_REQUEST, 400);
    }
    assignments.push('assigned_sales = ?');
    binds.push(assigned);
  }

  if ('next_contact_at' in body) {
    // null / 空文字はクリア扱い
    const value = body.next_contact_at;
    if (value === null || value === '') {
      assignments.push('next_contact_at = ?');
      binds.push(null);
    } else {
      const iso = asIsoDateTime(value);
      if (!iso) return errorResponse(ERROR_BAD_REQUEST, 400);
      assignments.push('next_contact_at = ?');
      binds.push(iso);
    }
  }

  if (!assignments.length) return errorResponse(ERROR_BAD_REQUEST, 400);

  assignments.push('updated_at = ?');
  binds.push(new Date().toISOString());

  try {
    const sql = `UPDATE diagnoses SET ${assignments.join(', ')} WHERE diagnosis_id = ?`;
    const result = await context.env.DB.prepare(sql)
      .bind(...binds, diagnosisId)
      .run();
    if (!result.success) return errorResponse(ERROR_SERVER, 500);

    const lead = await fetchLeadDetail(context.env.DB, diagnosisId);
    if (!lead) return errorResponse(ERROR_NOT_FOUND, 404);
    return json({ lead });
  } catch (error) {
    console.error('admin lead update failed:', error instanceof Error ? error.name : 'unknown');
    return errorResponse(ERROR_SERVER, 500);
  }
};
