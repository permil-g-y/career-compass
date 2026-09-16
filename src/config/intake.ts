/**
 * 新規リード受付の上限設定。
 *
 * ここだけを書き換えれば、受付の停止・再開・上限変更ができる。
 * D1 のデータは一切変更しない（判定はすべて SELECT / COUNT で行う）。
 */

/**
 * 新規受付の上限（ユニーク電話番号の人数）。
 *
 * 「回答総数」ではなく「ユニーク電話番号ベースの人数」で数える。
 * 同じ電話番号で複数回回答していても1人として扱う（管理画面の集計と同じ定義）。
 */
export const LEAD_LIMIT = 200;

/**
 * 診断開始済みユーザーの救済枠。
 *
 * 診断LPは上限ちょうどで新規開始を止めるが、そこから回答〜送信までの
 * 数分の間に上限へ到達したユーザーの送信まで弾くと、入力済みの回答が
 * 保存されず無駄になる。そのため保存APIだけはこの人数分だけ受け付ける。
 *
 * 0 にすると厳密に LEAD_LIMIT 人で打ち切る（救済しない）。
 */
export const LEAD_LIMIT_GRACE = 3;

/**
 * 受付モード。
 *
 *   'auto'   … LEAD_LIMIT に達するまで受け付ける（通常運用）
 *   'open'   … 上限を無視して常に受け付ける（受付再開したいとき）
 *   'closed' … 件数に関わらず受付を停止する（緊急停止したいとき）
 */
export const INTAKE_MODE: 'auto' | 'open' | 'closed' = 'closed';

/** 上限到達の判定（人数から受付可否を求める） */
export function isAcceptingLeads(uniqueLeads: number, limit: number = LEAD_LIMIT): boolean {
  if (INTAKE_MODE === 'open') return true;
  if (INTAKE_MODE === 'closed') return false;
  return uniqueLeads < limit;
}
