/**
 * ルート（/）の振り分け。
 *
 * 管理用の Pages プロジェクト（career-compass-admin）と公開用プロジェクト
 * （career-compass）は同じリポジトリ・同じビルド成果物をデプロイしている。
 * そのため管理用プロジェクトのルートにも診断アプリ（dist/index.html）が同居し、
 * 新規受付を停止していると管理画面URLのルートで受付停止画面が出てしまう。
 *
 * 環境変数 ADMIN_ONLY=true が設定されたプロジェクトでのみ、
 * ルートを管理画面（/admin/）へ転送する。
 *
 * - 公開用プロジェクトには ADMIN_ONLY を設定しない。
 *   その場合はここで何もせず、これまでどおり診断アプリを配信する。
 * - 受付停止（src/config/intake.ts）の判定はここでは一切行わない。
 *   受付の可否と管理画面の利用可否は完全に独立している。
 */
import type { Env, PagesFunction } from './types';

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    if (context.env.ADMIN_ONLY === 'true') {
      const url = new URL(context.request.url);
      url.pathname = '/admin/';
      url.search = '';
      return Response.redirect(url.toString(), 302);
    }
  } catch {
    // 判定に失敗しても公開LPの配信は止めない
  }
  return context.next();
};
