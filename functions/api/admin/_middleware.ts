/**
 * /api/admin/* 共通のアクセス制御。
 *
 * 管理APIはこのミドルウェアを必ず通る。認証できない場合はここで打ち切り、
 * D1 へのクエリを一切実行しない（未認証で個人情報へ到達する経路を作らない）。
 *
 * 一般公開API（POST /api/diagnoses）とはディレクトリごと分離しており、
 * このミドルウェアは公開API側には一切影響しない。
 */
import { authenticateAdmin } from '../../lib/adminAuth';
import { ERROR_FORBIDDEN, errorResponse, isCrossOrigin } from '../../lib/http';
import type { AdminAuthData, Env, PagesFunction } from '../../types';

export const onRequest: PagesFunction<Env, AdminAuthData> = async (context) => {
  const { request, env, data } = context;

  // クロスオリジンからの利用は受け付けない（CORSも開放しない）
  if (isCrossOrigin(request)) return errorResponse(ERROR_FORBIDDEN, 403);

  const auth = await authenticateAdmin(request, env);
  if (!auth.ok) {
    // 設定不足か認証失敗かはクライアントへ区別させない
    return errorResponse(ERROR_FORBIDDEN, 403);
  }

  // 後続ハンドラーへ認証済みの担当者情報を渡す（営業履歴の記録に使用）
  data.admin = { email: auth.identity.email };

  return context.next();
};
