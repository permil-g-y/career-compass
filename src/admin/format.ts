/**
 * 管理画面の表示フォーマット。
 *
 * 日時はすべて営業担当者のローカルタイム（日本国内での利用を想定）で表示する。
 * 個人情報をこのモジュールから外部へ送信・保存することはない。
 */

const DATE_TIME = new Intl.DateTimeFormat('ja-JP', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_TIME_FULL = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** "08/17 19:14" 形式（一覧テーブル用） */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '—';
  return DATE_TIME.format(new Date(time));
}

/** "2026/08/17 19:14" 形式（詳細画面用） */
export function formatDateTimeFull(iso: string | null | undefined): string {
  if (!iso) return '—';
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '—';
  return DATE_TIME_FULL.format(new Date(time));
}

/** 電話番号を架電しやすい表記へ整える（保存値は数字のみ） */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits || '—';
}

/** 登録から24時間以内なら NEW 表示（管理画面要件定義書 8.4） */
export function isNewLead(iso: string | null | undefined, now = Date.now()): boolean {
  if (!iso) return false;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return false;
  return now - time < 24 * 60 * 60 * 1000;
}

/** 次回対応日時が現在時刻を過ぎているか（一覧での注意表示用） */
export function isOverdue(iso: string | null | undefined, now = Date.now()): boolean {
  if (!iso) return false;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return false;
  return time < now;
}

/** ISO8601 → <input type="datetime-local"> の値（ローカルタイム） */
export function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  const date = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** <input type="datetime-local"> の値 → ISO8601（空欄は null＝クリア） */
export function fromDateTimeLocalValue(value: string): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}

/** 準備度スコアの表示（小数第1位まで） */
export function formatScore(score: number | null | undefined, digits = 1): string {
  if (score === null || score === undefined || !Number.isFinite(score)) return '—';
  return score.toFixed(digits);
}
