/**
 * 管理画面 API の型定義（サーバー / フロント共通）
 *
 * ここに定義するのは「認証済み管理画面だけが受け取るデータ」であり、
 * 一般公開APIのレスポンスには一切含めない。
 */
import type { ActionId, Grade, MainQuestionKey, ReadinessKey } from '../types/diagnosis';
import type { SalesStatus } from './config/sales';

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
  assigned_sales: string;
  last_contacted_at: string | null;
  next_contact_at: string | null;
  /** 同一電話番号の回答回数（1なら重複なし） */
  answer_count: number;
  /** 初回回答日時 */
  first_answered_at: string;
  /** 最新回答日時（created_at と同じ値） */
  last_answered_at: string;
}

/** ダッシュボード上部のサマリー（管理画面要件定義書 8.2） */
export interface LeadStats {
  /** 今日（JST）初めて登録された電話番号の人数 */
  today_new: number;
  /** 未架電 */
  not_called: number;
  /** 再架電 */
  recall: number;
  /** 面談予約 */
  appointment: number;
  /** ユニーク電話番号の総数（実際のリード数） */
  unique_leads: number;
  /** 回答の総数（重複を含む） */
  total_answers: number;
}

export interface LeadListResponse {
  stats: LeadStats;
  leads: LeadSummary[];
  /** 絞り込み条件に一致した総件数（表示件数ではない） */
  total: number;
  limit: number;
  offset: number;
}

/** 営業担当者マスタ（D1: sales_users） */
export interface SalesUser {
  id: number;
  name: string;
  email: string | null;
  /** 1=有効 / 0=無効（無効でも過去の担当者名は保持される） */
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SalesUsersResponse {
  sales_users: SalesUser[];
}

/** 営業担当者の追加・更新 */
export interface SalesUserInput {
  name?: string;
  email?: string | null;
  is_active?: boolean;
}

/** 同一電話番号の回答履歴1件 */
export interface AnswerHistoryEntry {
  diagnosis_id: string;
  created_at: string;
  overall_score: number | null;
  overall_grade: Grade | null;
  career_type: string | null;
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
    /** 同一電話番号のすべての回答（新しい順） */
    answer_history: AnswerHistoryEntry[];
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
