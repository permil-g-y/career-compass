/**
 * 管理画面 HTML（/admin 配下）のアクセス制御。
 *
 * 一次防御は Cloudflare Access（Cloudflare ダッシュボードで /admin* に対して設定する）。
 * このミドルウェアはその多重防御で、Access 未設定・JWT 未検証の状態で
 * 管理画面を配信しないための保険として動作する。
 *
 * なお管理画面 HTML 自体には個人情報を一切含まない。
 * 氏名・電話番号は /api/admin/* から取得し、そちらは
 * functions/api/admin/_middleware.ts で独立して保護している。
 *
 * このミドルウェアの適用範囲は /admin 配下のみで、
 * 既存の診断アプリ（/）には一切影響しない。
 */
import { authenticateAdmin } from '../lib/adminAuth';
import type { Env, PagesFunction } from '../types';

const DENIED_HTML = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Career Compass Admin</title></head>
<body style="font-family:system-ui,sans-serif;background:#F5F7FB;color:#14204F;margin:0;padding:64px 24px;">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #E2E8F5;border-radius:12px;padding:32px;">
<h1 style="font-size:18px;margin:0 0 12px;">この画面は閲覧できません</h1>
<p style="font-size:14px;line-height:1.8;color:#41557F;margin:0;">
管理画面は認証されたユーザーのみ利用できます。<br />
Cloudflare Access のログインを完了してからアクセスしてください。
</p></div></body></html>`;

export const onRequest: PagesFunction<Env> = async (context) => {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.ok) {
    return new Response(DENIED_HTML, {
      status: 403,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  }
  return context.next();
};
