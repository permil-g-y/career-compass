/**
 * POST /api/diagnoses  診断回答・リード情報・診断結果を D1 へ保存する
 * GET  /api/diagnoses  保存状況の確認（開発用 / ADMIN_TOKEN 必須・個人情報は返さない）
 *
 * D1 binding 名は DB（context.env.DB）を前提とする。
 *
 * 個人情報の取り扱い:
 * - 氏名・電話番号はログへ一切出力しない
 * - GET は件数と非個人情報のみを返す（氏名・電話番号は返却しない）
 */
import { DIAGNOSIS_COLUMNS } from '../../src/types/diagnosis';
import type { DiagnosisPayload } from '../../src/types/diagnosis';
import type { Env, PagesFunction } from '../types';

const MAX_BODY_BYTES = 8 * 1024;
const GRADES = ['A', 'B', 'C', 'D', 'E'];

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

/** 電話番号を数字のみへ正規化する（クライアント側と同じ扱いにする） */
function normalizePhone(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, '');
}

function asString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * 受信データを検証し、保存用の値へ整形する。
 * 不正な場合はエラーメッセージを返す（個人情報は含めない）。
 */
function buildRow(
  input: Record<string, unknown>,
): { row: DiagnosisPayload } | { error: string } {
  const diagnosisId = asString(input.diagnosis_id, 100);
  if (!diagnosisId) return { error: 'diagnosis_id is required' };

  const name = asString(input.name, 100);
  if (!name) return { error: 'name is required' };

  const rawPhone = asString(input.phone, 40);
  const phone = rawPhone ? normalizePhone(rawPhone) : '';
  if (!/^0\d{9,10}$/.test(phone)) return { error: 'phone is invalid' };

  const createdAt = asString(input.created_at, 40) ?? new Date().toISOString();

  const grade = asString(input.overall_grade, 1);
  const overallGrade = grade && GRADES.includes(grade) ? (grade as DiagnosisPayload['overall_grade']) : null;

  return {
    row: {
      diagnosis_id: diagnosisId,
      created_at: createdAt,
      age: asNumber(input.age),
      graduation_year: asString(input.graduation_year, 40),
      q1: asString(input.q1, 100),
      q2: asString(input.q2, 100),
      q3: asString(input.q3, 100),
      q4: asString(input.q4, 100),
      q5: asString(input.q5, 100),
      q6: asString(input.q6, 100),
      q7: asString(input.q7, 100),
      q8: asString(input.q8, 100),
      q9: asString(input.q9, 100),
      q10: asString(input.q10, 100),
      name,
      phone,
      overall_score: asNumber(input.overall_score),
      overall_grade: overallGrade,
      career_type: asString(input.career_type, 60),
      self_understanding: asNumber(input.self_understanding),
      gakuchika: asNumber(input.gakuchika),
      career_design: asNumber(input.career_design),
      company_selection: asNumber(input.company_selection),
      application_preparation: asNumber(input.application_preparation),
      interview_preparation: asNumber(input.interview_preparation),
      selection_experience: asNumber(input.selection_experience),
      roadmap_current_step: asNumber(input.roadmap_current_step),
      weakness_1: asString(input.weakness_1, 60),
      weakness_2: asString(input.weakness_2, 60),
      weakness_3: asString(input.weakness_3, 60),
      action_1: asString(input.action_1, 60) as DiagnosisPayload['action_1'],
      action_2: asString(input.action_2, 60) as DiagnosisPayload['action_2'],
      action_3: asString(input.action_3, 60) as DiagnosisPayload['action_3'],
    },
  };
}

/** 同じ diagnosis_id での再送信は上書きする（リトライで重複しないようにする） */
const INSERT_SQL = `INSERT INTO diagnoses (${DIAGNOSIS_COLUMNS.join(', ')})
VALUES (${DIAGNOSIS_COLUMNS.map(() => '?').join(', ')})
ON CONFLICT(diagnosis_id) DO UPDATE SET ${DIAGNOSIS_COLUMNS.filter((c) => c !== 'diagnosis_id')
  .map((c) => `${c} = excluded.${c}`)
  .join(', ')}`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return json({ ok: false, error: 'D1 binding "DB" is not configured' }, 500);
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'payload too large' }, 413);
  }

  let input: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return json({ ok: false, error: 'invalid body' }, 400);
    }
    input = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }

  const built = buildRow(input);
  if ('error' in built) {
    return json({ ok: false, error: built.error }, 400);
  }

  try {
    const values = DIAGNOSIS_COLUMNS.map((column) => built.row[column] ?? null);
    await env.DB.prepare(INSERT_SQL)
      .bind(...values)
      .run();
    return json({ ok: true, diagnosis_id: built.row.diagnosis_id }, 201);
  } catch (error) {
    // 個人情報は出力しない。診断IDとエラー種別のみ記録する。
    console.error(
      'D1 insert failed',
      built.row.diagnosis_id,
      error instanceof Error ? error.message : 'unknown error',
    );
    return json({ ok: false, error: 'failed to save' }, 500);
  }
};

/**
 * 保存確認用（開発・運用チェック）。
 * ADMIN_TOKEN が未設定なら 404。設定時も氏名・電話番号は返さない。
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.ADMIN_TOKEN) {
    return json({ ok: false, error: 'not found' }, 404);
  }
  if (request.headers.get('x-admin-token') !== env.ADMIN_TOKEN) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  if (!env.DB) {
    return json({ ok: false, error: 'D1 binding "DB" is not configured' }, 500);
  }

  try {
    const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM diagnoses').first<{
      count: number;
    }>();

    // 氏名・電話番号は取得しない（保存されているかの有無のみ返す）
    const recent = await env.DB.prepare(
      `SELECT diagnosis_id, created_at, saved_at, age, graduation_year,
              overall_score, overall_grade, career_type, roadmap_current_step,
              action_1, action_2, action_3,
              (name IS NOT NULL AND name != '') AS has_name,
              (phone IS NOT NULL AND phone != '') AS has_phone
       FROM diagnoses ORDER BY created_at DESC LIMIT 20`,
    ).all();

    return json({ ok: true, count: count?.count ?? 0, recent: recent.results ?? [] }, 200);
  } catch (error) {
    console.error(
      'D1 select failed',
      error instanceof Error ? error.message : 'unknown error',
    );
    return json({ ok: false, error: 'failed to read' }, 500);
  }
};
