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
 * Cloudflare Pages の binding。
 * サーバー側でのみ参照され、フロントエンドのバンドルには一切含まれない。
 */
export interface Env {
  /** D1 binding 名は DB を前提とする */
  DB: D1Database;
}

export interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  waitUntil(promise: Promise<unknown>): void;
}

export type PagesFunction<E = unknown> = (
  context: EventContext<E>,
) => Response | Promise<Response>;
