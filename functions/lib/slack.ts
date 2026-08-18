/**
 * Slack Incoming Webhook への新規リード通知。
 *
 * 位置づけ:
 * - POST /api/diagnoses の D1 保存が成功した「後」に走る付随処理。
 *   通知の失敗・遅延・Webhook障害が診断フローへ影響しないよう、
 *   この関数は例外を外へ投げない（すべて内部で握りつぶしてログのみ残す）。
 *
 * 個人情報の取り扱い方針（functions/api/diagnoses.ts と同じ方針）:
 * - 電話番号・Q1〜Q10 の回答内容は通知へ含めない。
 *   営業上の詳細は Cloudflare Access で保護された管理画面から参照する設計とする。
 * - 氏名・電話番号を console／ログへ出力しない。ログはエラー種別のみ。
 *
 * Webhook URL は Cloudflare の Secret（SLACK_WEBHOOK_URL）からのみ取得し、
 * ソースコード・フロントエンドのバンドルには一切含めない。
 */
import { DEFAULT_SALES_STATUS } from '../../src/admin/config/sales';
import type { Env } from '../types';

/** Slack Incoming Webhook 以外のホストへは絶対に送信しない（設定ミス時のSSRF防止） */
const SLACK_WEBHOOK_HOST = 'hooks.slack.com';

/** Slack 側が応答しない場合でも待ち続けない */
const SLACK_TIMEOUT_MS = 5000;

/** 管理画面のURL（Secret ではないため既定値をコードに置く。SLACK_ADMIN_URL で上書き可能） */
const DEFAULT_ADMIN_URL = 'https://career-compass-admin.pages.dev/admin/';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 値が無い項目の表示 */
const UNKNOWN = '未設定';

/** Slack へ通知する項目（電話番号・回答内容は意図的に持たせない） */
export interface SlackLeadNotification {
  name: string;
  graduation_year: string | null;
  overall_grade: string | null;
  career_type: string | null;
  /** 回答日時（ISO8601 / UTC） */
  created_at: string;
}

/**
 * 通知の有効・無効。
 * 明示的に "true" が設定されたときのみ送信する（未設定は無効）。
 * Preview 環境から本番チャンネルへ通知が飛ばないようにするための安全弁。
 */
function isEnabled(env: Env): boolean {
  return (env.SLACK_NOTIFICATIONS_ENABLED ?? '').trim().toLowerCase() === 'true';
}

/** Webhook URL を検証して返す。不正・未設定なら null（＝送信しない）。 */
function webhookUrl(env: Env): string | null {
  const raw = (env.SLACK_WEBHOOK_URL ?? '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    if (url.hostname !== SLACK_WEBHOOK_HOST) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** 通知に載せる管理画面URL */
function adminUrl(env: Env): string {
  const raw = (env.SLACK_ADMIN_URL ?? '').trim();
  if (!raw) return DEFAULT_ADMIN_URL;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.toString() : DEFAULT_ADMIN_URL;
  } catch {
    return DEFAULT_ADMIN_URL;
  }
}

/**
 * Slack のメッセージ本文で特別な意味を持つ文字をエスケープする。
 * 氏名などの入力値がリンク記法として解釈されないようにする。
 */
function escapeSlack(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** ISO8601（UTC）を JST の "YYYY/MM/DD HH:MM" へ整形する */
function formatJst(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return UNKNOWN;
  const jst = new Date(time + JST_OFFSET_MS);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    `${jst.getUTCFullYear()}/${pad(jst.getUTCMonth() + 1)}/${pad(jst.getUTCDate())} ` +
    `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`
  );
}

function field(value: string | null): string {
  return escapeSlack(value ?? UNKNOWN);
}

/** 通知本文を組み立てる（送信処理から分離してテストしやすくする） */
export function buildLeadMessage(lead: SlackLeadNotification, admin: string): string {
  return [
    '【Career Compass｜新規リード】',
    '',
    '新しい診断回答が入りました。',
    '',
    `氏名：${field(lead.name)}`,
    `卒業年度：${field(lead.graduation_year)}`,
    `総合判定：${field(lead.overall_grade)}`,
    `就活タイプ：${field(lead.career_type)}`,
    // 保存直後の営業ステータスは必ず初期値（migration 0002 の DEFAULT）
    `ステータス：${DEFAULT_SALES_STATUS}`,
    '',
    '管理画面：',
    admin,
    '',
    '回答日時：',
    formatJst(lead.created_at),
  ].join('\n');
}

/**
 * 新規リードを Slack へ通知する。
 *
 * この関数は決して例外を投げない。呼び出し側（保存API）は結果を待たずに
 * waitUntil へ委ねてよく、Slack 側の障害が診断のレスポンスへ波及しない。
 */
export async function notifyNewLead(env: Env, lead: SlackLeadNotification): Promise<void> {
  if (!isEnabled(env)) return;

  const url = webhookUrl(env);
  if (!url) {
    // URL の中身はログへ出さない（Secret のため）
    console.error('Slack notification skipped: webhook url is missing or invalid');
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SLACK_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ text: buildLeadMessage(lead, adminUrl(env)) }),
      signal: controller.signal,
    });
    if (!response.ok) {
      // Slack のレスポンス本文には Webhook URL が含まれ得るため、ステータスのみ記録する
      console.error('Slack notification failed with status:', response.status);
    }
  } catch (error) {
    // 個人情報・URL は出力しない。種別のみ記録する。
    console.error('Slack notification error:', error instanceof Error ? error.name : 'unknown');
  } finally {
    clearTimeout(timer);
  }
}
