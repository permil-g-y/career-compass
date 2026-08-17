/**
 * 管理画面 API の型定義（サーバー / フロント共通）
 *
 * ここに定義するのは「認証済み管理画面だけが受け取るデータ」であり、
 * 一般公開APIのレスポンスには一切含めない。
 */
import type { ActionId, Grade, MainQuestionKey, ReadinessKey } from '../types/diagnosis';
import type { SalesPerson, SalesStatus } from './config/sales';

/** 一覧テーブル1行分（管理画面要件定義書 8.3） */
export interface LeadSummary {
  diagnosis_id: string;
  created_at: string;
  name: string;
  phone: string;
  graduation_year: string | null;
  overall_grade: Grade | null;
  career_type: string | null;
  sales_status: SalesStatus;
  assigned_sales: SalesPerson;
  last_contacted_at: string | null;
  next_contact_at: string | null;
}

/** ダッシュボード上部のサマリー（管理画面要件定義書 8.2） */
export interface LeadStats {
  /** 今日（JST）の新規リード数 */
  today_new: number;
  /** 未架電 */
  not_called: number;
  /** 再架電 */
  recall: number;
  /** 面談予約 */
  appointment: number;
}

export interface LeadListResponse {
  stats: LeadStats;
  leads: LeadSummary[];
  /** 絞り込み条件に一致した総件数（表示件数ではない） */
  total: number;
  limit: number;
  offset: number;
}

/** 営業履歴1件 */
export interface SalesActivity {
  id: number;
  sales_person: string;
  status: string | null;
  note: string | null;
  contacted_at: string;
  created_at: string;
}

/**
 * リード詳細（管理画面要件定義書 13〜18章）
 * D1 の1行をそのまま平坦に返す（診断原本 + 営業管理カラム + 営業履歴）。
 */
export type LeadDetailData = LeadSummary &
  Record<MainQuestionKey, string | null> &
  Record<ReadinessKey, number | null> & {
    age: number | null;
    overall_score: number | null;
    roadmap_current_step: number | null;
    weakness_1: string | null;
    weakness_2: string | null;
    weakness_3: string | null;
    action_1: ActionId | null;
    action_2: ActionId | null;
    action_3: ActionId | null;
    updated_at: string | null;
    activities: SalesActivity[];
  };

export interface LeadDetailResponse {
  lead: LeadDetailData;
}

/** 並び替え（管理画面要件定義書 10章） */
export type LeadSort = 'newest' | 'oldest' | 'next_contact';

/** 一覧の絞り込み条件 */
export interface LeadQuery {
  /** 氏名・電話番号のフリーワード検索 */
  q: string;
  status: string;
  assigned: string;
  graduation_year: string;
  grade: string;
  career_type: string;
  /** 登録日（JSTの YYYY-MM-DD） */
  date_from: string;
  date_to: string;
  sort: LeadSort;
}

/** 営業情報の更新（PATCH /api/admin/leads/:id） */
export interface LeadUpdateInput {
  sales_status?: string;
  assigned_sales?: string;
  /** ISO8601。空文字は「クリア」を意味する */
  next_contact_at?: string | null;
}

/** 営業履歴の追加（POST /api/admin/leads/:id/activities） */
export interface ActivityInput {
  sales_person: string;
  status: string;
  note: string;
  /** ISO8601。省略時はサーバー側の現在時刻 */
  contacted_at?: string;
  /** 次回対応日時も同時に更新する場合に指定する */
  next_contact_at?: string | null;
}
