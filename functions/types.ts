/**
 * Cloudflare Pages Functions / D1 の最小型定義。
 *
 * @cloudflare/workers-types を追加せずに型を効かせるため、
 * 本プロジェクトで使う範囲だけを自前で定義している。
 */

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<unknown>;
}

/**
 * Cloudflare Pages の binding / 環境変数。
 * サーバー側でのみ参照され、フロントエンドのバンドルには一切含まれない。
 */
export interface Env {
  /** D1 binding 名は DB を前提とする */
  DB: D1Database;

  /* ---- 管理画面（/admin）の認証用。Cloudflare ダッシュボードで設定する ---- */

  /** Cloudflare Access のチーム名（例: your-team / your-team.cloudflareaccess.com） */
  ADMIN_ACCESS_TEAM_DOMAIN?: string;
  /**
   * Cloudflare Access アプリケーションの Application Audience (AUD) Tag。
   * ホストごとに Access アプリが分かれる場合（本体とプレビューなど）は
   * カンマ区切りで複数指定できる。
   */
  ADMIN_ACCESS_AUD?: string;
  /**
   * ローカル開発（wrangler pages dev）でのみ認証を迂回するフラグ。
   * .dev.vars へ "true" を設定した場合かつ localhost からのアクセス時のみ有効。
   * 本番・Preview 環境には絶対に設定しない。
   */
  ADMIN_DEV_BYPASS?: string;

  /* ---- 新規リードの Slack 通知（functions/lib/slack.ts） ---- */

  /**
   * Slack Incoming Webhook の URL。**Secret として登録する**（平文の変数にしない）。
   * コードへ直接記載せず、フロントエンドへも渡さない。
   */
  SLACK_WEBHOOK_URL?: string;
  /**
   * 通知の有効・無効。"true" のときのみ送信する（未設定は無効）。
   * Production のみ true とし、Preview は未設定のままにする。
   */
  SLACK_NOTIFICATIONS_ENABLED?: string;
  /** 通知本文に載せる管理画面URL（未設定時はコード側の既定値を使う） */
  SLACK_ADMIN_URL?: string;
}

/** 管理APIのミドルウェアが後続へ引き渡す認証情報 */
export interface AdminAuthData {
  admin?: {
    /** Cloudflare Access で認証されたユーザーのメールアドレス */
    email: string | null;
  };
}

export interface EventContext<E, D = Record<string, unknown>> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  data: D;
  waitUntil(promise: Promise<unknown>): void;
  /** 後続のミドルウェア / 静的アセットへ処理を渡す */
  next(): Promise<Response>;
}

export type PagesFunction<E = unknown, D = Record<string, unknown>> = (
  context: EventContext<E, D>,
) => Response | Promise<Response>;
