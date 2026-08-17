/**
 * 管理API共通のレスポンスヘルパー。
 *
 * - クライアントへ返すエラーは固定文言のみとし、SQL・DB・個人情報を一切含めない。
 * - 管理APIのレスポンスはキャッシュさせない（no-store）。
 * - CORS ヘッダーは付与しない（同一オリジンからの利用のみを想定）。
 */

export const ERROR_BAD_REQUEST = 'invalid request';
export const ERROR_FORBIDDEN = 'forbidden';
export const ERROR_NOT_FOUND = 'not found';
export const ERROR_METHOD = 'method not allowed';
export const ERROR_SERVER = 'internal error';

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'x-content-type-options': 'nosniff',
    },
  });
}

export function errorResponse(message: string, status: number): Response {
  return json({ ok: false, error: message }, status);
}

/**
 * 同一オリジン以外からのリクエストを弾く。
 * 一般公開API（POST /api/diagnoses）と同じ方針で、CORS は開放しない。
 */
export function isCrossOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}

/** 受け付けるリクエストボディの上限（管理APIは営業メモを含むため少し大きめ） */
export const MAX_BODY_BYTES = 16 * 1024;

/** JSON ボディを安全に読み取る。不正な場合は null を返す。 */
export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return null;

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return null;

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** 文字列として受け取り、trim・最大長を適用する（空文字は null） */
export function asString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/** ISO8601 として解釈できる日時のみ受け付け、UTCのISO文字列へ正規化する */
export function asIsoDateTime(value: unknown): string | null {
  const raw = asString(value, 40);
  if (!raw) return null;
  const time = Date.parse(raw);
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}
