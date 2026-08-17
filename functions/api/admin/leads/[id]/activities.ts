/**
 * 営業履歴の追加 API（管理画面専用）
 *
 *   POST /api/admin/leads/:id/activities
 *
 * 営業活動は診断原本（diagnoses の診断カラム）へ上書きせず、
 * sales_activities テーブルへ履歴として積む（管理画面要件定義書 20章・23章）。
 * 併せて diagnoses 側の営業管理カラム（最終対応日時など）を同期する。
 *
 * 認証は functions/api/admin/_middleware.ts で完了している。
 */
import { isSalesStatus, MAX_NOTE_LENGTH } from '../../../../../src/admin/config/sales';
import {
  ERROR_BAD_REQUEST,
  ERROR_NOT_FOUND,
  ERROR_SERVER,
  asIsoDateTime,
  errorResponse,
  json,
  readJsonBody,
} from '../../../../lib/http';
import { asDiagnosisId, fetchLeadDetail } from '../../../../lib/leads';
import { isAssignableSalesPerson, UNASSIGNED_SALES } from '../../../../lib/salesUsers';
import type { Env, PagesFunction } from '../../../../types';

const INSERT_ACTIVITY_SQL = `INSERT INTO sales_activities
  (diagnosis_id, sales_person, status, note, contacted_at, created_at)
VALUES (?, ?, ?, ?, ?, ?)`;

const UNASSIGNED = UNASSIGNED_SALES;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const diagnosisId = asDiagnosisId(context.params.id);
  if (!diagnosisId) return errorResponse(ERROR_BAD_REQUEST, 400);

  const body = await readJsonBody(context.request);
  if (!body) return errorResponse(ERROR_BAD_REQUEST, 400);

  if (!context.env.DB) {
    console.error('D1 binding is unavailable');
    return errorResponse(ERROR_SERVER, 500);
  }

  // 担当営業は sales_users マスタ（または「未設定」）の値のみ受け付ける
  const salesPerson = body.sales_person;
  if (
    typeof salesPerson !== 'string' ||
    !(await isAssignableSalesPerson(context.env.DB, salesPerson))
  ) {
    return errorResponse(ERROR_BAD_REQUEST, 400);
  }

  // ステータスは省略可（メモだけを残すケース）
  let status: string | null = null;
  if (body.status !== undefined && body.status !== null && body.status !== '') {
    if (!isSalesStatus(body.status)) return errorResponse(ERROR_BAD_REQUEST, 400);
    status = body.status;
  }

  let note: string | null = null;
  if (typeof body.note === 'string') {
    const trimmed = body.note.trim();
    note = trimmed ? trimmed.slice(0, MAX_NOTE_LENGTH) : null;
  }

  // ステータスもメモも無い履歴は記録しない
  if (!status && !note) return errorResponse(ERROR_BAD_REQUEST, 400);

  const contactedAt =
    body.contacted_at === undefined || body.contacted_at === null || body.contacted_at === ''
      ? new Date().toISOString()
      : asIsoDateTime(body.contacted_at);
  if (!contactedAt) return errorResponse(ERROR_BAD_REQUEST, 400);

  let nextContactAt: string | null | undefined;
  if ('next_contact_at' in body) {
    const value = body.next_contact_at;
    if (value === null || value === '') {
      nextContactAt = null;
    } else {
      nextContactAt = asIsoDateTime(value);
      if (!nextContactAt) return errorResponse(ERROR_BAD_REQUEST, 400);
    }
  }

  const now = new Date().toISOString();

  // diagnoses 側の同期対象（カラム名は静的 / 値は bind）
  const assignments = ['last_contacted_at = ?', 'updated_at = ?'];
  const updateBinds: unknown[] = [contactedAt, now];
  if (status) {
    assignments.push('sales_status = ?');
    updateBinds.push(status);
  }
  if (salesPerson !== UNASSIGNED) {
    assignments.push('assigned_sales = ?');
    updateBinds.push(salesPerson);
  }
  if (nextContactAt !== undefined) {
    assignments.push('next_contact_at = ?');
    updateBinds.push(nextContactAt);
  }

  try {
    // 対象リードの存在確認（存在しない diagnosis_id で履歴だけが増えないようにする）
    const exists = await context.env.DB.prepare(
      'SELECT diagnosis_id FROM diagnoses WHERE diagnosis_id = ?',
    )
      .bind(diagnosisId)
      .first<{ diagnosis_id: string }>();
    if (!exists) return errorResponse(ERROR_NOT_FOUND, 404);

    await context.env.DB.batch([
      context.env.DB.prepare(INSERT_ACTIVITY_SQL).bind(
        diagnosisId,
        salesPerson,
        status,
        note,
        contactedAt,
        now,
      ),
      context.env.DB.prepare(
        `UPDATE diagnoses SET ${assignments.join(', ')} WHERE diagnosis_id = ?`,
      ).bind(...updateBinds, diagnosisId),
    ]);

    const lead = await fetchLeadDetail(context.env.DB, diagnosisId);
    if (!lead) return errorResponse(ERROR_NOT_FOUND, 404);
    return json({ lead }, 201);
  } catch (error) {
    // 営業メモ本文・個人情報はログへ出さない
    console.error('admin activity insert failed:', error instanceof Error ? error.name : 'unknown');
    return errorResponse(ERROR_SERVER, 500);
  }
};
