/**
 * GET /api/intake
 *
 * 診断LPが「新規の診断を開始してよいか」を判定するための公開API。
 *
 * 返すのは受付可否だけで、現在の登録人数や上限値は返さない
 * （事業上の数値を一般公開しないため）。
 * D1 への読み取りのみで、データは一切変更しない。
 */
import { isIntakeOpen } from '../lib/intake';
import type { Env, PagesFunction } from '../types';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  // 判定できない場合は受付中として扱う（障害で受付を止めてしまわない）
  if (!context.env.DB) {
    console.error('D1 binding is unavailable');
    return json({ accepting: true }, 200);
  }

  try {
    return json({ accepting: await isIntakeOpen(context.env.DB) }, 200);
  } catch (error) {
    console.error('intake check failed:', error instanceof Error ? error.name : 'unknown');
    return json({ accepting: true }, 200);
  }
};
