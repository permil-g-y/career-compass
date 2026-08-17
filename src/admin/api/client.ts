/**
 * 管理API クライアント。
 *
 * セキュリティ方針:
 * - D1 へはブラウザから直接アクセスしない。必ず /api/admin/* を経由する。
 * - 氏名・電話番号を URL（クエリ文字列）へ載せない。
 *   フリーワード検索は POST のボディで送る。
 * - 取得したデータを localStorage / sessionStorage へ保存しない（メモリ上のみ）。
 * - 個人情報を console へ出力しない。
 */
import type {
  ActivityInput,
  LeadDetailResponse,
  LeadListResponse,
  LeadQuery,
  LeadUpdateInput,
} from '../types';

const BASE = '/api/admin';

/** 認証切れ（Cloudflare Access のセッション失効など） */
export class AdminAuthError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'AdminAuthError';
  }
}

/** 通信・サーバー側のエラー（詳細はサーバーから返さない） */
export class AdminApiError extends Error {
  constructor(readonly status: number) {
    super(`request failed: ${status}`);
    this.name = 'AdminApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    // Cloudflare Access のクッキーを送るため同一オリジンの資格情報を付与する
    credentials: 'same-origin',
    headers: {
      accept: 'application/json',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401 || response.status === 403) throw new AdminAuthError();
  if (!response.ok) throw new AdminApiError(response.status);

  return (await response.json()) as T;
}

/** フリーワード検索以外の条件をクエリ文字列へ組み立てる（個人情報は含めない） */
function toSearchParams(query: LeadQuery, limit: number, offset: number): string {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.assigned) params.set('assigned', query.assigned);
  if (query.graduation_year) params.set('graduation_year', query.graduation_year);
  if (query.grade) params.set('grade', query.grade);
  if (query.career_type) params.set('career_type', query.career_type);
  if (query.date_from) params.set('date_from', query.date_from);
  if (query.date_to) params.set('date_to', query.date_to);
  params.set('sort', query.sort);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  return params.toString();
}

export const adminApi = {
  /**
   * リード一覧を取得する。
   * 氏名・電話番号での検索がある場合のみ POST（検索語をURLへ出さないため）。
   */
  async listLeads(
    query: LeadQuery,
    options: { limit: number; offset: number; signal?: AbortSignal },
  ): Promise<LeadListResponse> {
    const { limit, offset, signal } = options;

    if (query.q.trim()) {
      return request<LeadListResponse>('/leads', {
        method: 'POST',
        body: JSON.stringify({ ...query, limit, offset }),
        signal,
      });
    }

    return request<LeadListResponse>(`/leads?${toSearchParams(query, limit, offset)}`, { signal });
  },

  getLead(diagnosisId: string, signal?: AbortSignal): Promise<LeadDetailResponse> {
    return request<LeadDetailResponse>(`/leads/${encodeURIComponent(diagnosisId)}`, { signal });
  },

  updateLead(diagnosisId: string, input: LeadUpdateInput): Promise<LeadDetailResponse> {
    return request<LeadDetailResponse>(`/leads/${encodeURIComponent(diagnosisId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  addActivity(diagnosisId: string, input: ActivityInput): Promise<LeadDetailResponse> {
    return request<LeadDetailResponse>(
      `/leads/${encodeURIComponent(diagnosisId)}/activities`,
      { method: 'POST', body: JSON.stringify(input) },
    );
  },
};

/** 画面へ表示するエラーメッセージへ変換する（内部情報は出さない） */
export function toErrorMessage(error: unknown): string {
  if (error instanceof AdminAuthError) {
    return '認証の有効期限が切れています。ページを再読み込みしてログインし直してください。';
  }
  if (error instanceof AdminApiError) {
    if (error.status === 404) return '対象のリードが見つかりませんでした。';
    return '通信に失敗しました。時間をおいて再度お試しください。';
  }
  return '通信に失敗しました。時間をおいて再度お試しください。';
}
