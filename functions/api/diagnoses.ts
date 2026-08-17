/**
 * POST /api/diagnoses
 * 診断回答・リード情報・診断結果を D1 へ保存する。
 *
 * このファイルが D1 へ触れる唯一の経路であり、公開APIは本POSTのみ。
 * 保存済みデータを読み出すエンドポイントは意図的に提供しない
 * （diagnosis_id 等を指定して第三者の氏名・電話番号を取得できる経路を作らないため）。
 * 保存データの閲覧は Cloudflare ダッシュボードの D1 コンソールから行う。
 *
 * 個人情報の取り扱い方針:
 * - 氏名・電話番号はレスポンスに一切含めない
 * - 氏名・電話番号はログへ一切出力しない
 * - エラーレスポンスに内部構造・SQL・DB情報を含めない
 * - SQL は prepared statement + bind のみを使用する
 */
import { DIAGNOSIS_COLUMNS } from '../../src/types/diagnosis';
import type { DiagnosisPayload } from '../../src/types/diagnosis';
import type { Env, PagesFunction } from '../types';

/** 受け付けるリクエストボディの上限 */
const MAX_BODY_BYTES = 8 * 1024;

const GRADES = ['A', 'B', 'C', 'D', 'E'];

/** クライアントが採番する診断IDの形式 */
const DIAGNOSIS_ID_PATTERN = /^cc_[A-Za-z0-9-]{8,64}$/;

/**
 * クライアントへ返すエラーは固定文言のみとする。
 * 内部の失敗理由（SQL・DB・binding の有無など）は外に出さない。
 */
const ERROR_BAD_REQUEST = 'invalid request';
const ERROR_SERVER = 'internal error';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      // CORS ヘッダーは付与しない（同一オリジンからの利用のみを想定）
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

function asNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

/**
 * 受信データをサーバー側で検証し、保存用の値へ整形する。
 * クライアントの値をそのまま信用せず、型・範囲・長さをすべてここで確定させる。
 */
function buildRow(input: Record<string, unknown>): DiagnosisPayload | null {
  const diagnosisId = asString(input.diagnosis_id, 100);
  if (!diagnosisId || !DIAGNOSIS_ID_PATTERN.test(diagnosisId)) return null;

  const name = asString(input.name, 100);
  if (!name) return null;

  const rawPhone = asString(input.phone, 40);
  const phone = rawPhone ? normalizePhone(rawPhone) : '';
  if (!/^0\d{9,10}$/.test(phone)) return null;

  const createdAtInput = asString(input.created_at, 40);
  const createdAt =
    createdAtInput && !Number.isNaN(Date.parse(createdAtInput))
      ? createdAtInput
      : new Date().toISOString();

  const grade = asString(input.overall_grade, 1);
  const overallGrade =
    grade && GRADES.includes(grade) ? (grade as DiagnosisPayload['overall_grade']) : null;

  const answer = (key: string): string | null => asString(input[key], 100);
  /** 7項目の準備度スコアは 1.0〜5.0 の範囲のみ受け付ける */
  const readiness = (key: string): number | null => asNumber(input[key], 1, 5);

  return {
    diagnosis_id: diagnosisId,
    created_at: createdAt,
    age: asNumber(input.age, 0, 120),
    graduation_year: asString(input.graduation_year, 40),
    q1: answer('q1'),
    q2: answer('q2'),
    q3: answer('q3'),
    q4: answer('q4'),
    q5: answer('q5'),
    q6: answer('q6'),
    q7: answer('q7'),
    q8: answer('q8'),
    q9: answer('q9'),
    q10: answer('q10'),
    name,
    phone,
    overall_score: asNumber(input.overall_score, 0, 100),
    overall_grade: overallGrade,
    career_type: asString(input.career_type, 60),
    self_understanding: readiness('self_understanding'),
    gakuchika: readiness('gakuchika'),
    career_design: readiness('career_design'),
    company_selection: readiness('company_selection'),
    application_preparation: readiness('application_preparation'),
    interview_preparation: readiness('interview_preparation'),
    selection_experience: readiness('selection_experience'),
    roadmap_current_step: asNumber(input.roadmap_current_step, 1, 10),
    weakness_1: asString(input.weakness_1, 60),
    weakness_2: asString(input.weakness_2, 60),
    weakness_3: asString(input.weakness_3, 60),
    action_1: asString(input.action_1, 60) as DiagnosisPayload['action_1'],
    action_2: asString(input.action_2, 60) as DiagnosisPayload['action_2'],
    action_3: asString(input.action_3, 60) as DiagnosisPayload['action_3'],
  };
}

/**
 * カラム名はすべて静的な定数由来で、値は必ず bind で渡す。
 * 同じ diagnosis_id での再送信は上書きし、重複行を作らない。
 */
const INSERT_SQL = `INSERT INTO diagnoses (${DIAGNOSIS_COLUMNS.join(', ')})
VALUES (${DIAGNOSIS_COLUMNS.map(() => '?').join(', ')})
ON CONFLICT(diagnosis_id) DO UPDATE SET ${DIAGNOSIS_COLUMNS.filter((c) => c !== 'diagnosis_id')
  .map((c) => `${c} = excluded.${c}`)
  .join(', ')}`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // クロスオリジンからの投稿は受け付けない（CORSも開放しない）
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return json({ ok: false, error: ERROR_BAD_REQUEST }, 403);
      }
    } catch {
      return json({ ok: false, error: ERROR_BAD_REQUEST }, 403);
    }
  }

  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json({ ok: false, error: ERROR_BAD_REQUEST }, 415);
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: ERROR_BAD_REQUEST }, 413);
  }

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    // content-length が無い / 偽装されている場合に備えて実データでも検査する
    if (raw.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: ERROR_BAD_REQUEST }, 413);
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return json({ ok: false, error: ERROR_BAD_REQUEST }, 400);
    }
    input = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: ERROR_BAD_REQUEST }, 400);
  }

  const row = buildRow(input);
  if (!row) {
    // どの項目が不正かは返さない（内部仕様の推測材料を与えない）
    return json({ ok: false, error: ERROR_BAD_REQUEST }, 400);
  }

  // binding の有無もクライアントには区別させない
  if (!env.DB) {
    console.error('D1 binding is unavailable');
    return json({ ok: false, error: ERROR_SERVER }, 500);
  }

  try {
    const values = DIAGNOSIS_COLUMNS.map((column) => row[column] ?? null);
    await env.DB.prepare(INSERT_SQL)
      .bind(...values)
      .run();
    // レスポンスには保存済みデータを含めない
    return json({ ok: true }, 201);
  } catch (error) {
    // 個人情報とエラー詳細（SQL断片等）は出力しない。種別のみ記録する。
    console.error('D1 insert failed:', error instanceof Error ? error.name : 'unknown');
    return json({ ok: false, error: ERROR_SERVER }, 500);
  }
};
