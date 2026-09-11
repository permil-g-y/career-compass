/**
 * 新規受付の可否を取得する（診断LP用）。
 *
 * 判定に失敗した場合は必ず「受付中」として扱う。
 * 通信障害やAPIエラーで受付を止めてしまい、取りこぼすことを避けるため。
 * 上限の実質的な担保は保存API（POST /api/diagnoses）側で行う。
 */

const INTAKE_ENDPOINT = '/api/intake';

/** 新規に診断を開始してよいか */
export async function fetchIntakeOpen(): Promise<boolean> {
  try {
    const response = await fetch(INTAKE_ENDPOINT, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return true;
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') return true;
    return (body as { accepting?: unknown }).accepting !== false;
  } catch {
    return true;
  }
}
